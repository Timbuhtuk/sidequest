import data from './book-goals.json';
import type {StageId} from './tracker-data';

export type BookGoal = {
    id:string;
    number:number;
    stage:StageId;
    title:string;
    titleEn:string;
    location:string;
    hint:string;
};

export const bookGoals = data as BookGoal[];
export const bookGoalIds = bookGoals.map(book => book.id);
