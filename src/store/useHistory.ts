import { create } from 'zustand';
import { Move } from '../board/Move';


type HistoryState = {
  history: Move[];
  addMove: (move: Move) => void;
  lastMove:()=>Move

};

export const useHistory = create<HistoryState>((set,get) => ({
  history: [],
  addMove: (move) => set((state) => ({ history: [...state.history, move] })),
  lastMove:()=>get().history.slice(-1)[0]
 
}));