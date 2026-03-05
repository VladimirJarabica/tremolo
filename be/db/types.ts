import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { Meter } from "./enums";

export type List = {
    id: Generated<string>;
    name: string;
    userId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type ListItem = {
    transpose: Generated<number>;
    listId: string;
    sheetId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Sheet = {
    id: Generated<string>;
    slug: string;
    title: Generated<string>;
    content: string;
    meter: Meter;
    tempo: number;
    userId: string;
    deletedAt: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type SheetToTag = {
    A: string;
    B: string;
};
export type Tag = {
    id: Generated<string>;
    name: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type User = {
    id: Generated<string>;
    email: string;
    authId: string | null;
    deletedAt: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type DB = {
    _SheetToTag: SheetToTag;
    List: List;
    ListItem: ListItem;
    Sheet: Sheet;
    Tag: Tag;
    User: User;
};
