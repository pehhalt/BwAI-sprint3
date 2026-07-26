export type Project = {
  id: string;
  user_id: string;
  title: string;
  target_audience: string;
  global_instructions: string;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  source_text: string;
  source_page_start: number | null;
  source_page_end: number | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type RewriteVersionStatus =
  | "draft"
  | "manually_edited"
  | "approved"
  | "rejected";

export type RewriteVersion = {
  id: string;
  section_id: string;
  project_id: string;
  user_id: string;
  rewritten_text: string;
  section_instructions: string;
  model: string;
  status: RewriteVersionStatus;
  created_at: string;
  updated_at: string;
};
