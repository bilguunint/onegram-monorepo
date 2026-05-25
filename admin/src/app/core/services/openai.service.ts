import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';

export interface AiConversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiReport {
  id: string;
  title: string;
  type: 'pdf' | 'word';
  fileName: string;
  url: string;
  downloadUrl: string;
  size: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {

  private baseUrl = 'https://us-central1-grammgold.cloudfunctions.net';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = await new Promise<firebase.User>((resolve, reject) => {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) return resolve(currentUser);
      const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
        unsubscribe();
        if (u) resolve(u);
        else reject(new Error('Нэвтрээгүй байна'));
      });
    });
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async sendMessage(message: string, conversationId?: string): Promise<{ message: string; conversationId: string; model?: string }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/aiChat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversationId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `API error: ${response.status}`);
    }
    const data = await response.json();
    return { message: data.message, conversationId: data.conversationId, model: data.model };
  }

  async getConversations(): Promise<AiConversation[]> {
    const user = await this.getCurrentUser();
    const snapshot = await firebase.firestore()
      .collection('ai_conversations')
      .where('adminUid', '==', user.uid)
      .orderBy('updatedAt', 'desc')
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Яриа',
        messageCount: data.messages?.length || 0,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as AiConversation;
    });
  }

  async getConversation(conversationId: string): Promise<{ title: string; messages: AiChatMessage[] }> {
    const doc = await firebase.firestore().collection('ai_conversations').doc(conversationId).get();
    if (!doc.exists) throw new Error('Яриа олдсонгүй');
    const data = doc.data();
    return {
      title: data.title || 'Яриа',
      messages: (data.messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await firebase.firestore().collection('ai_conversations').doc(conversationId).delete();
  }

  async getReports(): Promise<AiReport[]> {
    const user = await this.getCurrentUser();
    const snapshot = await firebase.firestore()
      .collection('ai_reports')
      .where('createdBy', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiReport));
  }

  async deleteReport(reportId: string): Promise<void> {
    await firebase.firestore().collection('ai_reports').doc(reportId).delete();
  }

  private getCurrentUser(): Promise<firebase.User> {
    return new Promise((resolve, reject) => {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) return resolve(currentUser);
      const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
        unsubscribe();
        if (u) resolve(u);
        else reject(new Error('Нэвтрээгүй байна'));
      });
    });
  }
}
