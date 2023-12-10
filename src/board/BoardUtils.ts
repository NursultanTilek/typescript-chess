import BoardFactory from './BoardFactory';
import Coordination from './Coordination';



export class BoardUtils {
  static getDiagonalCoordinationBetween(source: Coordination, target: Coordination):  Set<Coordination> {
   
    const result: Set<Coordination> = new Set();

    const fileShift = source.file < target.file ? 1 : -1;
    const rankShift = source.rank < target.rank ? 1 : -1;

    for (
      let fileIndex = source.file.charCodeAt(0) - Coordination.charNumber + fileShift, rank = source.rank + rankShift;
      fileIndex !== target.file.charCodeAt(0) - Coordination.charNumber && rank !== target.rank;
      fileIndex += fileShift, rank += rankShift  
    ) {
      result.add(new Coordination(BoardFactory.files[fileIndex], rank));
    }

    return result;
  }

  static getVerticalCoordinationBetween(source: Coordination, target: Coordination) {
    const result: Coordination[] = [];
    
    const rankShift = source.rank < target.rank ? 1 : -1;

    for (let rank = source.rank + rankShift; rank !== target.rank; rank += rankShift) {
      result.push(new Coordination(source.file, rank));
    }

    return result;
  }

  static getHorizontalCoordinationBetween(source: Coordination, target: Coordination) {
    const result: Coordination[] = [];

    const fileShift = source.file < target.file ? 1 : -1;

    for (
      let fileIndex = source.file.charCodeAt(0) - Coordination.charNumber + fileShift; 
      fileIndex !== target.file.charCodeAt(0) - Coordination.charNumber;
      fileIndex += fileShift
    ) {
      result.push(new Coordination(BoardFactory.files[fileIndex], source.rank));
    }

    return result;
  }


}

