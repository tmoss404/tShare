export enum AccessLevels {
    Create = 1 << 0,
    Delete = 1 << 1,
    Read = 1 << 2,
    Write = 1 << 3,
    ReadWrite = 1 << 2 | 1 << 3 
}