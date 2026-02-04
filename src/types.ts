export interface Task {
  id: string;
  text: string;
  createdAt: number;
}

export interface State {
  tasks: Task[];
  completed: Task[];
  later: Task[];
}

export type Action =
  | { type: "ADD"; payload: string }
  | { type: "COMPLETE" }
  | { type: "LATER" }
  | { type: "UNDO_LATER" }
  | { type: "UNDO_COMPLETE" }
  | { type: "CLEAR_HISTORY" };
