import { useState, useEffect, useRef } from "react";
import { TrackMetadata, Playlist } from "../types";
import { db } from "../db";
import { searchTracks } from "../utils";

interface UseLibraryProps {
  showToast: (message: string, showUndo?: boolean, action?: () => void) => void;
}

export function useLibrary({ showToast }: UseLibraryProps) {
  const [tracks, setTracks] = useState<TrackMetadata[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<TrackMetadata[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string>("all");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState({ current: 0, total: 0 });

  const workerRef = useRef<Worker | null>(null);
  const undoStackRef = useRef<{ metadata: TrackMetadata; audioBlob: Blob; coverBlob?: Blob } | null>(null);

  // Initialize DB and background worker
  useEffect(() => {
    async function initDB() {
      await db.init();
      await loadLibrary();
    }
    initDB();

    // Spawn Background Worker for parsing ID3 tags
    workerRef.current = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Update filtered list on search, playlist change, favorites, or tracks list updates
  useEffect(() => {
    let list = [...tracks];

    if (activePlaylistId === "favorites") {
      list = list.filter((t) => favorites.has(t.id));
    } else if (activePlaylistId === "recently-played") {
      list = list
        .filter((t) => t.lastPlayed)
        .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
        .slice(0, 15);
    } else if (activePlaylistId === "most-played") {
      list = list
        .filter((t) => t.playCount > 0)
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 15);
    } else if (activePlaylistId !== "all") {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      if (pl) {
        const idSet = new Set(pl.trackIds);
        list = list.filter((t) => idSet.has(t.id));
      }
    }

    if (searchQuery.trim()) {
      list = searchTracks(list, searchQuery);
    }

    setFilteredTracks(list);
  }, [tracks, activePlaylistId, playlists, favorites, searchQuery]);

  // Load playlists and tracks metadata from IndexedDB
  const loadLibrary = async () => {
    const allMetadata = await db.getAllMetadata();
    const sortedTracks = allMetadata.sort((a, b) => a.title.localeCompare(b.title));
    setTracks(sortedTracks);

    const favSet = new Set(sortedTracks.filter((t) => t.isFavorite).map((t) => t.id));
    setFavorites(favSet);

    const customPlaylists = await db.getAllPlaylists();
    setPlaylists(customPlaylists);
  };

  // File Ingestion logic with Web Worker & Web Audio duration extraction
  const handleIngestFiles = async (filesList: FileList) => {
    if (!filesList || filesList.length === 0 || !workerRef.current) return;

    setIsIngesting(true);
    setIngestProgress({ current: 0, total: filesList.length });

    const total = filesList.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const file = filesList[i];
      if (!file.type.startsWith("audio/")) continue;

      setIngestProgress({ current: i + 1, total });

      try {
        const fileBuffer = await file.arrayBuffer();

        // Send to Worker thread for metadata parsing
        const parsedData = await new Promise<any>((resolve) => {
          const onWorkerMessage = (e: MessageEvent) => {
            workerRef.current?.removeEventListener("message", onWorkerMessage);
            resolve(e.data);
          };
          workerRef.current?.addEventListener("message", onWorkerMessage);

          workerRef.current?.postMessage({
            fileBuffer,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          }, [fileBuffer]);
        });

        // Safe main-thread check of track duration using URL object
        const tempAudio = new Audio();
        const fileDuration = await new Promise<number>((res) => {
          tempAudio.addEventListener("loadedmetadata", () => {
            res(tempAudio.duration);
          });
          tempAudio.addEventListener("error", () => {
            res(0);
          });
          tempAudio.src = URL.createObjectURL(file);
        });

        URL.revokeObjectURL(tempAudio.src);

        const metadata: Omit<TrackMetadata, "id"> = {
          title: parsedData.title,
          artist: parsedData.artist,
          album: parsedData.album,
          genre: parsedData.genre,
          duration: fileDuration || 180,
          fileSize: file.size,
          hasCover: !!parsedData.coverBlob,
          isFavorite: false,
          playCount: 0,
        };

        await db.addTrack(metadata, file, parsedData.coverBlob || undefined);
        successCount++;
      } catch (err) {
        console.error("Failed to ingest file:", file.name, err);
      }
    }

    setIsIngesting(false);
    await loadLibrary();
    showToast(`تم تحميل ${successCount} أغنية بنجاح في المكتبة!`);
  };

  const handleToggleFavorite = async (trackId: number) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    const isFav = !track.isFavorite;
    await db.updateTrackMetadata(trackId, { isFavorite: isFav });

    setFavorites((prev) => {
      const updated = new Set(prev);
      if (isFav) updated.add(trackId);
      else updated.delete(trackId);
      return updated;
    });

    await loadLibrary();
  };

  const handleDeleteTrack = async (trackId: number, currentTrackId?: number, onActiveTrackDeleted?: () => void) => {
    const trackToDel = tracks.find((t) => t.id === trackId);
    if (!trackToDel) return;

    try {
      const blobs = await db.getTrackBlobs(trackId);
      if (blobs) {
        undoStackRef.current = {
          metadata: trackToDel,
          audioBlob: blobs.audioBlob,
          coverBlob: blobs.coverBlob,
        };
      }

      await db.deleteTrack(trackId);
      await loadLibrary();

      if (currentTrackId === trackId && onActiveTrackDeleted) {
        onActiveTrackDeleted();
      }

      showToast(`تم حذف الأغنية: ${trackToDel.title}`, true, handleUndoDelete);
    } catch (err) {
      console.error("Failed to delete track:", err);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoStackRef.current) return;
    const { metadata, audioBlob, coverBlob } = undoStackRef.current;

    try {
      await db.addTrack(metadata, audioBlob, coverBlob);
      undoStackRef.current = null;
      await loadLibrary();
      showToast("🔄 تم التراجع واستعادة الأغنية بنجاح!");
    } catch (err) {
      console.error("Undo restore failed:", err);
    }
  };

  const handleCreatePlaylist = async (name: string, desc?: string) => {
    const pl: Playlist = {
      id: Math.random().toString(36).substring(7),
      name,
      description: desc,
      trackIds: [],
      isCustom: true,
    };
    await db.savePlaylist(pl);
    await loadLibrary();
    showToast(`تم إنشاء قائمة جديدة: ${name}`);
  };

  const handleDeletePlaylist = async (id: string) => {
    await db.deletePlaylist(id);
    if (activePlaylistId === id) setActivePlaylistId("all");
    await loadLibrary();
    showToast("تم حذف قائمة التشغيل");
  };

  const handleAddTrackToPlaylist = async (playlistId: string, trackId: number) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    if (pl.trackIds.includes(trackId)) {
      showToast("الأغنية مضافة بالفعل في هذه القائمة");
      return;
    }

    const updated = {
      ...pl,
      trackIds: [...pl.trackIds, trackId],
    };

    await db.savePlaylist(updated);
    await loadLibrary();
    showToast(`تمت إضافة الأغنية إلى القائمة: ${pl.name}`);
  };

  return {
    tracks,
    filteredTracks,
    playlists,
    activePlaylistId,
    favorites,
    searchQuery,
    isIngesting,
    ingestProgress,
    setActivePlaylistId,
    setSearchQuery,
    loadLibrary,
    handleIngestFiles,
    handleToggleFavorite,
    handleDeleteTrack,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
  };
}
