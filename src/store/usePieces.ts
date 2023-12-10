import {create} from 'zustand';
import { CoordinationId, PieceType } from '../types';

// Define a state
type MyState = {
  pieces: Map<CoordinationId, PieceType>;
  setPieces: (pieces: Map<CoordinationId, PieceType>) => void;
};

// Create a store
export const usePieces = create<MyState>((set) => ({
  pieces: new Map<CoordinationId, PieceType>(),
  setPieces: (pieces) => set({ pieces }),
}));

