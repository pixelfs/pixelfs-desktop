// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {v1} from '../models';
import {context} from '../models';

export function CopyFile(arg1:v1.FileContext,arg2:v1.FileContext):Promise<void>;

export function DownloadFile(arg1:v1.FileContext):Promise<void>;

export function GetFileList(arg1:v1.FileContext):Promise<Array<v1.File>>;

export function Mkdir(arg1:v1.FileContext):Promise<void>;

export function MoveFile(arg1:v1.FileContext,arg2:v1.FileContext):Promise<void>;

export function PlayVideo(arg1:v1.FileContext):Promise<void>;

export function RemoveFile(arg1:v1.FileContext):Promise<void>;

export function RenameFile(arg1:v1.FileContext,arg2:v1.FileContext):Promise<void>;

export function Start(arg1:context.Context):Promise<void>;

export function StatFile(arg1:v1.FileContext):Promise<v1.File>;

export function UploadFile(arg1:v1.FileContext):Promise<void>;
