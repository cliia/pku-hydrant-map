export type Hydrant = {
  id: number;
  x_coord: number;
  y_coord: number;
  image_large_path: string;
  image_thumb_path: string;
  created_at?: string;
};

export type Mode = 'view' | 'edit';
