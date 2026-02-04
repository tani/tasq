import {
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import type { Action, Task } from "../types";

interface TaskCardProps {
  task: Task;
  dispatch: (action: Action) => void;
}

export function TaskCard({ task, dispatch }: TaskCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const bgOpacity = useTransform(
    [x, y],
    ([latestX, latestY]) =>
      Math.min(Math.max(Math.abs(latestX), Math.abs(latestY)) / 150, 1) * 0.5,
  );
  const bgColor = useTransform([x, y], ([latestX, latestY]) => {
    if (Math.abs(latestX) >= Math.abs(latestY)) {
      if (latestX > 0) return "rgba(34, 197, 94, 1)"; // Right/Complete (green)
      if (latestX < 0) return "rgba(239, 68, 68, 1)"; // Left/Undo Complete (red)
      return "rgba(255, 255, 255, 0)";
    }
    if (latestY < 0) return "rgba(234, 179, 8, 1)"; // Up/Later (yellow)
    if (latestY > 0) return "rgba(59, 130, 246, 1)"; // Down/Undo Later (blue)
    return "rgba(255, 255, 255, 0)";
  });

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    const { x: offsetX, y: offsetY } = info.offset;
    if (Math.abs(offsetX) >= Math.abs(offsetY)) {
      if (offsetX > threshold) {
        dispatch({ type: "COMPLETE" });
      } else if (offsetX < -threshold) {
        dispatch({ type: "UNDO_COMPLETE" });
      }
      return;
    }

    if (offsetY < -threshold) {
      dispatch({ type: "LATER" });
    } else if (offsetY > threshold) {
      dispatch({ type: "UNDO_LATER" });
    }
  };

  const cardClass =
    "task-card-size card position-relative bg-dark bg-opacity-75 border-0 rounded-5 text-white d-flex flex-column align-items-center justify-content-between p-4 shadow-lg user-select-none";

  return (
    <motion.div
      className={cardClass}
      style={{
        x,
        y,
        rotateX: useTransform(y, [-200, 200], [6, -6]),
        rotate: useTransform(x, [-200, 200], [-6, 6]),
      }}
      drag
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98, cursor: "grabbing" }}
      whileHover={{ scale: 1.02, cursor: "grab" }}
      initial={{ scale: 0.9, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Dynamic Background Color Overlay */}
      <motion.div
        className="position-absolute top-0 start-0 w-100 h-100 z-0 pe-none rounded-5"
        style={{ backgroundColor: bgColor, opacity: bgOpacity }}
      />

      {/* Card Content */}
      <div className="position-relative z-1 w-100 text-center flex-grow-1 d-flex flex-column justify-content-center">
        <div className="text-white-50 text-uppercase small fw-bold mb-3">
          Current Focus
        </div>
        <h2
          className="fw-bold lh-sm text-break mb-0"
          style={{
            fontSize:
              task.text.length > 50
                ? "1.5rem"
                : task.text.length > 20
                  ? "2rem"
                  : "2.5rem",
            textShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          {task.text}
        </h2>
      </div>

      {/* Action Hints */}
      <div className="position-relative z-1 w-100 pt-4 border-top border-white border-opacity-10">
        <div className="d-flex justify-content-center align-items-center gap-4 px-2 small fw-bold text-uppercase opacity-75">
          <div className="d-flex align-items-center gap-2 text-info">
            <i className="bi bi-arrow-up-circle-fill fs-5"></i>
            <span>Later</span>
          </div>
          <div className="d-flex align-items-center gap-2 text-success">
            <span>Complete</span>
            <i className="bi bi-check-circle-fill fs-5"></i>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
