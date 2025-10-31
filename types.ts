
export interface CharacterDescription {
  name: string;
  description: string;
}

export interface ProductDescription {
  name:string;
  description: string;
}

export interface ShotDescription {
  shot_number: number;
  shot_type: string;
  description: string;
  camera_angle: string;
  lens: string;
  movement: string;
}

export interface GeneratedShot extends ShotDescription {
  imageUrl: string;
}

export interface ScriptAnalysisResult {
  character_descriptions: CharacterDescription[];
  product_descriptions: ProductDescription[];
  shot_list: ShotDescription[];
}
