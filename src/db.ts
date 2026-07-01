import { TrackMetadata, TrackBlob, Playlist } from "./types";

const DB_NAME = "QuantumAudioCoreDB";
const DB_VERSION = 2;

export class MusicDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Metadata store
        if (!db.objectStoreNames.contains("tracks_metadata")) {
          const metadataStore = db.createObjectStore("tracks_metadata", {
            keyPath: "id",
            autoIncrement: true,
          });
          metadataStore.createIndex("title", "title", { unique: false });
          metadataStore.createIndex("artist", "artist", { unique: false });
          metadataStore.createIndex("album", "album", { unique: false });
          metadataStore.createIndex("isFavorite", "isFavorite", { unique: false });
        }

        // Blobs store
        if (!db.objectStoreNames.contains("tracks_blobs")) {
          db.createObjectStore("tracks_blobs", { keyPath: "id" });
        }

        // Playlists store
        if (!db.objectStoreNames.contains("playlists")) {
          db.createObjectStore("playlists", { keyPath: "id" });
        }

        // App general settings/metadata
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Add a track with blobs
  async addTrack(metadata: Omit<TrackMetadata, "id">, audioBlob: Blob, coverBlob?: Blob): Promise<number> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tracks_metadata", "tracks_blobs"], "readwrite");
      
      const metadataStore = transaction.objectStore("tracks_metadata");
      const blobsStore = transaction.objectStore("tracks_blobs");

      // Set hasCover based on presence of coverBlob
      const finalMetadata = { ...metadata, hasCover: !!coverBlob };

      const metadataRequest = metadataStore.add(finalMetadata);

      metadataRequest.onsuccess = () => {
        const trackId = metadataRequest.result as number;
        
        const blobData: TrackBlob = {
          id: trackId,
          audioBlob,
          coverBlob,
        };

        const blobsRequest = blobsStore.add(blobData);
        blobsRequest.onsuccess = () => {
          resolve(trackId);
        };
        blobsRequest.onerror = () => {
          reject(blobsRequest.error);
        };
      };

      metadataRequest.onerror = () => {
        reject(metadataRequest.error);
      };
    });
  }

  // Get all metadata (fast, paginated or full lazy cursor)
  async getAllMetadata(): Promise<TrackMetadata[]> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("tracks_metadata", "readonly");
      const store = transaction.objectStore("tracks_metadata");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Stream/chunk load metadata via cursor (supports true pagination and lazy loading)
  async loadMetadataChunk(offset: number, limit: number): Promise<TrackMetadata[]> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("tracks_metadata", "readonly");
      const store = transaction.objectStore("tracks_metadata");
      const request = store.openCursor();
      const results: TrackMetadata[] = [];
      let skipped = false;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) {
          resolve(results);
          return;
        }

        if (offset > 0 && !skipped) {
          cursor.advance(offset);
          skipped = true;
          return;
        }

        results.push(cursor.value);

        if (results.length < limit) {
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get blobs for a single track on demand (when playing)
  async getTrackBlobs(id: number): Promise<TrackBlob | null> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("tracks_blobs", "readonly");
      const store = transaction.objectStore("tracks_blobs");
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get a single metadata record
  async getTrackMetadata(id: number): Promise<TrackMetadata | null> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("tracks_metadata", "readonly");
      const store = transaction.objectStore("tracks_metadata");
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Update track metadata (favorite, playCount, lastPlayed, etc.)
  async updateTrackMetadata(id: number, updates: Partial<TrackMetadata>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("tracks_metadata", "readwrite");
      const store = transaction.objectStore("tracks_metadata");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (!data) {
          reject(new Error(`Track metadata with ID ${id} not found`));
          return;
        }

        const updatedData = { ...data, ...updates };
        const putRequest = store.put(updatedData);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete track from database (moves to Trash or hard deletes)
  async deleteTrack(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tracks_metadata", "tracks_blobs"], "readwrite");
      
      const metadataStore = transaction.objectStore("tracks_metadata");
      const blobsStore = transaction.objectStore("tracks_blobs");

      const mdDel = metadataStore.delete(id);
      const blobDel = blobsStore.delete(id);

      let count = 0;
      const checkResolve = () => {
        count++;
        if (count === 2) resolve();
      };

      mdDel.onsuccess = checkResolve;
      blobDel.onsuccess = checkResolve;

      mdDel.onerror = () => reject(mdDel.error);
      blobDel.onerror = () => reject(blobDel.error);
    });
  }

  // Playlists
  async savePlaylist(playlist: Playlist): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("playlists", "readwrite");
      const store = transaction.objectStore("playlists");
      const request = store.put(playlist);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("playlists", "readonly");
      const store = transaction.objectStore("playlists");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("playlists", "readwrite");
      const store = transaction.objectStore("playlists");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings Key-Value store
  async setSetting(key: string, value: any): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("settings", "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("settings", "readonly");
      const store = transaction.objectStore("settings");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? (request.result.value as T) : null);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new MusicDatabase();
