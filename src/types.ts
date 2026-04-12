export interface Config {
  scrollLength: number
  captureCount: number
  scrollInterval: number
  saveOnManualStop: boolean
  enableHumanLikeScrolling: boolean
  minScrollDelay: number
  maxScrollDelay: number
  scrollVariation: number
  selectors: {
    postContainer: string
    actorTitle: string
    actorDescription: string
    postText: string
    articleLink: string
    resharedContent: string[]
  }
  urlPatterns: {
    pulseArticle: string
    excludePatterns: string[]
  }
  filename: {
    prefix: string
    includeTimestamp: boolean
    extension: string
  }
  logging: {
    enabled: boolean
    level: 'debug' | 'info' | 'warn' | 'error'
  }
}

export interface ScrapedPost {
  name: string
  role: string
  summary: string
  articleUrl: string
  isReshare: boolean
}

export interface ActorAriaData {
  name: string
  profileType: string | null
  connectionDistance: string | null
}

export interface ActorData {
  name: string
  title: string
  profileUrl: string
  profileType: string | null
  connectionDistance: string | null
  verified: boolean
}

export interface CommentData {
  name: string
  profileUrl: string
  content: string
  isReply: boolean
  replies: CommentData[]
}

export interface PostData {
  actor: ActorData
  content: string
  hashtags: string[]
  postUrl: string | null
}

export interface ScraperMessage {
  action: 'start' | 'stop' | 'status'
}

export interface ScraperStatus {
  isScraping: boolean
  postsCollected: number
  targetCount: number
  progress: string
}
