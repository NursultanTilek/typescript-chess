
import { CoordinationId } from "../types";
import BoardFactory from "./BoardFactory";
import CoordinationShift from "./CoordinationShift";

export default class Coordination {
   file :string
   rank :number
   static charNumber=65

    constructor(file:string,rank:number) {
        this.file=file
        this.rank=rank
   
    }
    get id(): CoordinationId {
        return `${this.file}${this.rank}`;
    }

     canShift( shift:CoordinationShift):boolean {
        const f = this.file.charCodeAt(0) - Coordination.charNumber + shift.fileShift;
        const r = this.rank + shift.rankShift;

        if ((f < 0) || (f > 7)) return false; 
        if ((r < 1) || (r > 8)) return false; 

        return true;
    }

    
      shift( shift:CoordinationShift) {
        const newFileIndex = BoardFactory.files.indexOf(this.file) + shift.fileShift;
        const newFile = BoardFactory.files[newFileIndex];    
        const newRank=this.rank+shift.rankShift 
        return new Coordination(newFile,newRank);
      }
    }
