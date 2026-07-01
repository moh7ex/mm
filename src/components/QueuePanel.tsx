import React, { useState } from "react";
import { QueueItem } from "../types";
import { formatTime } from "../utils";
import { Trash2, GripVertical, Play, ArrowLeftRight } from "lucide-react";

interface QueuePanelProps {
  currentQueue: QueueItem[];
  upcomingQueue: QueueItem[];
  historyQueue: QueueItem[];
  currentTrackId?: number;
  accentColor: string;
  onPlayTrack: (trackId: number) => void;
  onRemoveFromQueue: (instanceId: string) => void;
  onReorderQueue: (newQueue: QueueItem[]) => void;
  onClearQueue: () => void;
}

export default function QueuePanel({
  currentQueue,
  upcomingQueue,
  historyQueue,
  currentTrackId,
  accentColor,
  onPlayTrack,
  onRemoveFromQueue,
  onReorderQueue,
  onClearQueue,
}: QueuePanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // HTML5 Drag and Drop handlers for reordering the upcoming queue
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const listCopy = [...upcomingQueue];
    const draggedItem = listCopy[draggedIndex];
    
    // Splice and insert
    listCopy.splice(draggedIndex, 1);
    listCopy.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onReorderQueue(listCopy);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-col gap-5 h-[420px]" id="queue-panel-root-node">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h4 className="font-semibold text-white text-base">📋 قائمة الانتظار (Queue)</h4>
          <span className="text-xs text-gray-400">تحكم بمسار الأغاني واسحب للترتيب</span>
        </div>
        {upcomingQueue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-xs hover:bg-white/10 text-red-400 px-3 py-1.5 rounded-xl border border-red-500/10 transition-colors"
          >
            مسح القائمة
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin">
        {/* NOW PLAYING SECTION */}
        {currentQueue.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">الأغنية الحالية (Now Playing)</span>
            {currentQueue
              .filter((item) => item.trackId === currentTrackId)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10"
                >
                  <img
                    src={(item.metadata as any).cover || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%25' height='100%25' fill='%23222'/></svg>"}
                    className="w-11 h-11 rounded-lg object-cover"
                    alt={item.metadata.title}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.metadata.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.metadata.artist}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-500">{formatTime(item.metadata.duration)}</span>
                </div>
              ))}
          </div>
        )}

        {/* UPCOMING QUEUE SECTION */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">التالي (Next Up)</span>
          {upcomingQueue.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4 bg-black/10 border border-white/5 rounded-2xl">
              لا توجد أغاني قادمة في قائمة الانتظار
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {upcomingQueue.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl group transition-all duration-150 cursor-grab active:cursor-grabbing ${
                    draggedIndex === index ? "opacity-50 border-dashed" : ""
                  }`}
                >
                  <div className="text-gray-500 hover:text-white transition-colors">
                    <GripVertical size={16} />
                  </div>

                  <img
                    src={(item.metadata as any).cover || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%25' height='100%25' fill='%23222'/></svg>"}
                    className="w-9 h-9 rounded-md object-cover"
                    alt={item.metadata.title}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.metadata.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.metadata.artist}</p>
                  </div>

                  <span className="text-[10px] font-mono text-gray-500 group-hover:hidden">
                    {formatTime(item.metadata.duration)}
                  </span>

                  {/* Group Action triggers */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => onPlayTrack(item.trackId)}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                      title="تشغيل الآن"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      onClick={() => onRemoveFromQueue(item.id)}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      title="حذف من القائمة"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTORY SECTION */}
        {historyQueue.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">سجل التشغيل (History)</span>
            <div className="flex flex-col gap-1 opacity-60 hover:opacity-100 transition-opacity duration-200">
              {historyQueue.slice(-5).reverse().map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10"
                  onClick={() => onPlayTrack(item.trackId)}
                >
                  <img
                    src={(item.metadata as any).cover || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%25' height='100%25' fill='%23222'/></svg>"}
                    className="w-9 h-9 rounded-md object-cover"
                    alt={item.metadata.title}
                  />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs font-semibold text-white truncate">{item.metadata.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.metadata.artist}</p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">{formatTime(item.metadata.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
