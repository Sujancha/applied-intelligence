export type Profile = {
  id: string
  display_name: string
  location: string | null
  languages: string[]
  default_output_language: string
  tone_preference: string
  directness: string
  humour_style: string
  job_title: string | null
  industry: string | null
  stakeholder_types: string[] | null
  business_type: string | null
  target_clients: string | null
  price_range: string | null
  common_objections: string[] | null
  sport: string | null
  team_role: string | null
  team_name: string | null
  team_level: string | null
  captaincy_style: string | null
  reading_genres: string[] | null
  why_i_read: string | null
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  user_id: string
  title: string
  author: string | null
  genre: string | null
  status: 'reading' | 'finished' | 'abandoned'
  cover_image_url: string | null
  total_insights: number
  applied_insights: number
  created_at: string
  updated_at: string
}

export type BookInsight = {
  id: string
  user_id: string
  book_id: string
  source_type: 'text' | 'image'
  source_text: string | null
  source_image_url: string | null
  user_reaction_note: string | null
  ai_core_idea: string | null
  ai_why_it_matters: string | null
  ai_raw_response: unknown
  output_language: string
  prompt_version_used: number | null
  user_rating: number | null
  created_at: string
  updated_at: string
}

export type InsightAction = {
  id: string
  insight_id: string
  user_id: string
  action_text: string
  context_tags: string[]
  suggested_timeframe: string | null
  status: 'pending' | 'tried_worked' | 'tried_flopped' | 'skipped'
  outcome_notes: string | null
  completed_at: string | null
  created_at: string
}

export type OutputStyleGuide = {
  id: string
  language: string
  style_instructions: string
  examples: string
  anti_examples: string | null
  updated_at: string
}

export type InsightWithActions = BookInsight & {
  insight_actions: InsightAction[]
}

export type InsightAIResponse = {
  core_idea: string
  why_it_matters: string
  actions: {
    action_text: string
    context_tags: string[]
    suggested_timeframe: string
  }[]
}
