export namespace anypb {
	
	export class Any {
	    type_url?: string;
	    value?: number[];
	
	    static createFrom(source: any = {}) {
	        return new Any(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type_url = source["type_url"];
	        this.value = source["value"];
	    }
	}

}

export namespace services {
	
	export class TransportManager {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Type: string;
	    NodeId: string;
	    Location: string;
	    Path: string;
	    Status: string;
	    Progress: number;
	    LocalPath?: string;
	
	    static createFrom(source: any = {}) {
	        return new TransportManager(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Type = source["Type"];
	        this.NodeId = source["NodeId"];
	        this.Location = source["Location"];
	        this.Path = source["Path"];
	        this.Status = source["Status"];
	        this.Progress = source["Progress"];
	        this.LocalPath = source["LocalPath"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace timestamppb {
	
	export class Timestamp {
	    seconds?: number;
	    nanos?: number;
	
	    static createFrom(source: any = {}) {
	        return new Timestamp(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.seconds = source["seconds"];
	        this.nanos = source["nanos"];
	    }
	}

}

export namespace v1 {
	
	export class Location {
	    id?: string;
	    node_id?: string;
	    name?: string;
	    type?: number;
	    path?: string;
	    block_size?: number;
	    block_duration?: number;
	
	    static createFrom(source: any = {}) {
	        return new Location(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.node_id = source["node_id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.path = source["path"];
	        this.block_size = source["block_size"];
	        this.block_duration = source["block_duration"];
	    }
	}
	export class AddLocationResponse {
	    location?: Location;
	
	    static createFrom(source: any = {}) {
	        return new AddLocationResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.location = this.convertValues(source["location"], Location);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StorageLink {
	    id?: string;
	    storage_id?: string;
	    node_id?: string;
	    location_id?: string;
	    limit_size?: number;
	    used_size?: number;
	
	    static createFrom(source: any = {}) {
	        return new StorageLink(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.storage_id = source["storage_id"];
	        this.node_id = source["node_id"];
	        this.location_id = source["location_id"];
	        this.limit_size = source["limit_size"];
	        this.used_size = source["used_size"];
	    }
	}
	export class AddStorageLinkResponse {
	    storage_link?: StorageLink;
	
	    static createFrom(source: any = {}) {
	        return new AddStorageLinkResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.storage_link = this.convertValues(source["storage_link"], StorageLink);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Storage {
	    id?: string;
	    name?: string;
	    type?: number;
	    network?: number;
	    Config: any;
	
	    static createFrom(source: any = {}) {
	        return new Storage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.network = source["network"];
	        this.Config = source["Config"];
	    }
	}
	export class AddStorageResponse {
	    storage?: Storage;
	
	    static createFrom(source: any = {}) {
	        return new AddStorageResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.storage = this.convertValues(source["storage"], Storage);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class File {
	    name?: string;
	    type?: number;
	    size?: number;
	    mode?: number;
	    hash?: string;
	    user?: string;
	    duration?: number;
	    platform?: string;
	    modified_at?: timestamppb.Timestamp;
	    extensions?: Record<string, anypb.Any>;
	
	    static createFrom(source: any = {}) {
	        return new File(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.size = source["size"];
	        this.mode = source["mode"];
	        this.hash = source["hash"];
	        this.user = source["user"];
	        this.duration = source["duration"];
	        this.platform = source["platform"];
	        this.modified_at = this.convertValues(source["modified_at"], timestamppb.Timestamp);
	        this.extensions = this.convertValues(source["extensions"], anypb.Any, true);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FileContext {
	    node_id?: string;
	    location?: string;
	    path?: string;
	
	    static createFrom(source: any = {}) {
	        return new FileContext(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.node_id = source["node_id"];
	        this.location = source["location"];
	        this.path = source["path"];
	    }
	}
	export class Node {
	    id?: string;
	    name?: string;
	    status?: number;
	    updatedAt?: timestamppb.Timestamp;
	    createdAt?: timestamppb.Timestamp;
	
	    static createFrom(source: any = {}) {
	        return new Node(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.status = source["status"];
	        this.updatedAt = this.convertValues(source["updatedAt"], timestamppb.Timestamp);
	        this.createdAt = this.convertValues(source["createdAt"], timestamppb.Timestamp);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetUserInfoResponse {
	    id?: string;
	    name?: string;
	    email?: string;
	    nodes?: Node[];
	    createdAt?: timestamppb.Timestamp;
	
	    static createFrom(source: any = {}) {
	        return new GetUserInfoResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.email = source["email"];
	        this.nodes = this.convertValues(source["nodes"], Node);
	        this.createdAt = this.convertValues(source["createdAt"], timestamppb.Timestamp);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class RemoveLocationResponse {
	
	
	    static createFrom(source: any = {}) {
	        return new RemoveLocationResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}
	
	
	export class StorageS3Config {
	    endpoint?: string;
	    access_key?: string;
	    secret_key?: string;
	    region?: string;
	    bucket?: string;
	    prefix?: string;
	    path_style?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new StorageS3Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.endpoint = source["endpoint"];
	        this.access_key = source["access_key"];
	        this.secret_key = source["secret_key"];
	        this.region = source["region"];
	        this.bucket = source["bucket"];
	        this.prefix = source["prefix"];
	        this.path_style = source["path_style"];
	    }
	}
	export class SyncConfig {
	    interval?: number;
	    duplex?: boolean;
	    limit?: number;
	    log?: string;
	    last_synced_at?: timestamppb.Timestamp;
	
	    static createFrom(source: any = {}) {
	        return new SyncConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.interval = source["interval"];
	        this.duplex = source["duplex"];
	        this.limit = source["limit"];
	        this.log = source["log"];
	        this.last_synced_at = this.convertValues(source["last_synced_at"], timestamppb.Timestamp);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Sync {
	    id?: string;
	    src_node_id?: string;
	    dest_node_id?: string;
	    name?: string;
	    enabled?: boolean;
	    status?: number;
	    src_context?: FileContext;
	    dest_context?: FileContext;
	    config?: SyncConfig;
	
	    static createFrom(source: any = {}) {
	        return new Sync(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.src_node_id = source["src_node_id"];
	        this.dest_node_id = source["dest_node_id"];
	        this.name = source["name"];
	        this.enabled = source["enabled"];
	        this.status = source["status"];
	        this.src_context = this.convertValues(source["src_context"], FileContext);
	        this.dest_context = this.convertValues(source["dest_context"], FileContext);
	        this.config = this.convertValues(source["config"], SyncConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

