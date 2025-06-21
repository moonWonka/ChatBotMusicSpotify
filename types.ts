
export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessageContent {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
}
