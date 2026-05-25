import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SimplebarAngularModule } from 'simplebar-angular';
import { PagetitleComponent } from 'src/app/shared/ui/pagetitle/pagetitle.component';
import { OpenaiService, AiConversation, AiReport } from 'src/app/core/services/openai.service';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
  time: string;
  model?: string;
}

@Component({
  selector: 'app-ai-worker',
  templateUrl: './ai-worker.component.html',
  styleUrls: ['./ai-worker.component.scss'],
  standalone: true,
  imports: [PagetitleComponent, CommonModule, SimplebarAngularModule, ReactiveFormsModule, FormsModule]
})
export class AiWorkerComponent implements OnInit {

  @ViewChild('chatScrollbar') chatScrollbar: any;

  breadCrumbItems: Array<{}>;
  chatForm: UntypedFormGroup;
  messages: ChatMessage[] = [];
  isTyping = false;
  currentConversationId: string | null = null;

  // Sidebar
  conversations: AiConversation[] = [];
  showHistory = true;
  loadingHistory = false;

  // Reports
  reports: AiReport[] = [];
  activeTab: 'conversations' | 'reports' = 'conversations';

  // Quick prompts
  quickPrompts = [
    { icon: 'bx-bar-chart-alt-2', label: 'Өнөөдрийн тайлан', prompt: 'Өнөөдрийн бизнесийн товч тайлан гаргаж өгнө үү.' },
    { icon: 'bx-trending-up', label: 'Сарын шинжилгээ', prompt: 'Энэ сарын борлуулалтын шинжилгээ хийж, өмнөх сартай харьцуулна уу.' },
    { icon: 'bx-group', label: 'Топ хэрэглэгчид', prompt: 'Хамгийн их алт эзэмшдэг топ 20 хэрэглэгчийн Pareto шинжилгээ хийнэ үү.' },
    { icon: 'bx-file', label: 'PDF тайлан', prompt: 'Энэ сарын бизнесийн гүйцэтгэлийн дэлгэрэнгүй PDF тайлан үүсгэнэ үү.' },
    { icon: 'bx-transfer-alt', label: 'Мөнгөн зарлага', prompt: 'Хүлээгдэж буй зарлагын хүсэлтүүдийг шинжилж, эрсдэлийн үнэлгээ хийнэ үү.' },
    { icon: 'bx-line-chart', label: 'KPI Dashboard', prompt: 'Бидний гол KPI үзүүлэлтүүдийг (DAU, ARPU, Retention, Conversion) тооцоолж, хүснэгтээр харуулна уу.' },
  ];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private openaiService: OpenaiService
  ) {}

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Onegram' }, { label: 'AI Ажилтан', active: true }];
    this.chatForm = this.formBuilder.group({
      message: ['', [Validators.required]],
    });
    this.messages.push({
      sender: 'ai',
      message: 'Сайн байна уу! Би таны **AI бизнес туслах ажилтан**. GrammGold-ын бүх бизнес мэдээлэлд хандах боломжтой.\n\n🔍 **Миний чадварууд:**\n• Бизнесийн тайлан гаргах (PDF, Word)\n• Борлуулалт, хэрэглэгчийн шинжилгээ\n• KPI тооцоолол, MoM өсөлт\n• Хэрэглэгчийн дэлгэрэнгүй мэдээлэл хайх\n• Стратегийн зөвлөгөө өгөх\n\nДоорх товчлууруудаас сонгох эсвэл өөрийн асуултаа бичнэ үү! 👇',
      time: this.getCurrentTime()
    });
    this.loadConversations();
    this.loadReports();
  }

  get form() { return this.chatForm.controls; }

  getCurrentTime(): string {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }

  formatMessage(text: string): string {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h6 class="mt-2 mb-1">$1</h6>')
      .replace(/^## (.+)$/gm, '<h5 class="mt-3 mb-1">$1</h5>')
      .replace(/^# (.+)$/gm, '<h4 class="mt-3 mb-2">$1</h4>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-2">')
      // Table support
      .replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => /^[\s-:]+$/.test(c))) return '<!--table-sep-->';
        const cellHtml = cells.map(c => `<td class="px-2 py-1 border">${c.trim()}</td>`).join('');
        return `<tr>${cellHtml}</tr>`;
      });
    // Wrap consecutive table rows in table
    html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, (match) => {
      const cleaned = match.replace(/<!--table-sep-->\n?/g, '');
      if (!cleaned.trim()) return '';
      const rows = cleaned.trim().split('\n').filter(r => r.trim());
      if (rows.length === 0) return '';
      const headerRow = rows[0].replace(/<td/g, '<th').replace(/<\/td>/g, '</th>');
      const bodyRows = rows.slice(1).join('\n');
      return `<div class="table-responsive my-2"><table class="table table-sm table-bordered mb-0"><thead class="table-light">${headerRow}</thead><tbody>${bodyRows}</tbody></table></div>`;
    });
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    // Clean up extra <br> around block elements
    html = html.replace(/<br>\s*(<h[456]|<hr|<div|<table)/g, '$1');
    html = html.replace(/(<\/h[456]>|<\/div>|<\/table>)\s*<br>/g, '$1');
    return html;
  }

  useQuickPrompt(prompt: string) {
    this.chatForm.patchValue({ message: prompt });
    this.sendMessage();
  }

  async sendMessage() {
    if (this.chatForm.invalid) return;
    const messageText = this.chatForm.get('message').value.trim();
    if (!messageText) return;

    this.messages.push({ sender: 'user', message: messageText, time: this.getCurrentTime() });
    this.chatForm.reset();
    this.scrollToBottom();
    this.isTyping = true;

    try {
      const result = await this.openaiService.sendMessage(messageText, this.currentConversationId);
      this.currentConversationId = result.conversationId;
      this.messages.push({
        sender: 'ai', message: result.message, time: this.getCurrentTime(), model: result.model
      });
      this.loadConversations();
      // Check if response contains report links
      if (result.message && (result.message.includes('storage.googleapis.com') || result.message.includes('report'))) {
        this.loadReports();
      }
    } catch (error) {
      this.messages.push({
        sender: 'ai',
        message: '❌ Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.\n\n`' + (error as Error).message + '`',
        time: this.getCurrentTime()
      });
    } finally {
      this.isTyping = false;
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatScrollbar) {
        const el = this.chatScrollbar.SimpleBar.getScrollElement();
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }

  // Sidebar methods
  async loadConversations() {
    try {
      this.conversations = await this.openaiService.getConversations();
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  }

  async loadReports() {
    try {
      this.reports = await this.openaiService.getReports();
    } catch (e) {
      console.error('Failed to load reports', e);
    }
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
    if (this.showHistory && this.activeTab === 'reports' && this.reports.length === 0) {
      this.loadReports();
    }
  }

  switchTab(tab: 'conversations' | 'reports') {
    this.activeTab = tab;
    if (tab === 'reports' && this.reports.length === 0) {
      this.loadReports();
    }
  }

  newConversation() {
    this.currentConversationId = null;
    this.messages = [{
      sender: 'ai',
      message: '🆕 Шинэ яриа эхэлж байна. Танд юугаар туслах вэ?',
      time: this.getCurrentTime()
    }];
  }

  async loadConversation(conv: AiConversation) {
    this.loadingHistory = true;
    try {
      const data = await this.openaiService.getConversation(conv.id);
      this.currentConversationId = conv.id;
      this.messages = data.messages.map(msg => ({
        sender: msg.role === 'user' ? 'user' as const : 'ai' as const,
        message: msg.content,
        time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : ''
      }));
      this.scrollToBottom();
    } catch (e) {
      console.error('Failed to load conversation', e);
    } finally {
      this.loadingHistory = false;
    }
  }

  async deleteConversation(event: Event, conv: AiConversation) {
    event.stopPropagation();
    if (!confirm('Энэ ярианы түүхийг устгах уу?')) return;
    try {
      await this.openaiService.deleteConversation(conv.id);
      if (this.currentConversationId === conv.id) this.newConversation();
      this.loadConversations();
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  }

  async deleteReport(event: Event, report: AiReport) {
    event.stopPropagation();
    if (!confirm('Энэ тайланг устгах уу?')) return;
    try {
      await this.openaiService.deleteReport(report.id);
      this.loadReports();
    } catch (e) {
      console.error('Failed to delete report', e);
    }
  }

  downloadReport(report: AiReport) {
    window.open(report.downloadUrl, '_blank');
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
