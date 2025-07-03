import { Note, ChatMessage } from '../types';

// Mock LLM service - replace with actual API integration
export class LLMService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateSummary(notes: Note[]): Promise<string> {
    // Simulate API call
    await this.delay(1000);
    
    const noteCount = notes.length;
    const totalMessages = notes.reduce((acc, note) => acc + note.messages.length, 0);
    const recentNotes = notes.slice(-5);
    
    return `📝 **Chat Notes Summary**

**Overview:** You have ${noteCount} chat notes with ${totalMessages} total messages.

**Recent Activity:** Your latest chat notes include:
${recentNotes.map(note => `• ${note.title} (${note.messages.length} messages)`).join('\n')}

**Key Insights:**
• Most active conversations: Recent weeks
• Average messages per note: ${Math.round(totalMessages / noteCount) || 0}
• Common themes: ${this.extractThemes(notes)}
• Suggested actions: Consider organizing related conversations together

*This is a mock summary. Connect to your preferred LLM service (OpenAI, Anthropic, etc.) for real AI-powered insights.*`;
  }

  async chatWithNotes(message: string, notes: Note[]): Promise<string> {
    // Simulate API call
    await this.delay(800);
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return this.generateSummary(notes);
    }
    
    if (lowerMessage.includes('count') || lowerMessage.includes('how many')) {
      const totalMessages = notes.reduce((acc, note) => acc + note.messages.length, 0);
      return `You currently have ${notes.length} chat notes with ${totalMessages} total messages.`;
    }
    
    if (lowerMessage.includes('recent') || lowerMessage.includes('latest')) {
      const recentNotes = notes.slice(-3);
      return `Your most recent chat notes are:\n${recentNotes.map(note => `• ${note.title} (${note.messages.length} messages)`).join('\n')}`;
    }
    
    if (lowerMessage.includes('export') || lowerMessage.includes('download')) {
      return `To export your chat notes as JSON, click the "JSON" button in the note editor. This will download a structured file with all your messages, timestamps, and metadata.`;
    }
    
    return `I understand you want to know: "${message}". While I'm currently in demo mode, I can help you with:

• **Summarizing** your chat notes
• **Counting** messages and conversations  
• **Finding** recent notes
• **Exporting** notes as JSON files

Try asking me to "summarize my notes" or "how many messages do I have"!

*Connect to a real LLM service for advanced AI conversations about your chat notes.*`;
  }

  private extractThemes(notes: Note[]): string {
    const allContent = notes
      .flatMap(note => note.messages.map(msg => msg.content))
      .join(' ')
      .toLowerCase();
    
    const commonWords = allContent
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 3)
      .join(', ');
    
    return commonWords || 'Various topics';
  }
}

export const llmService = new LLMService();