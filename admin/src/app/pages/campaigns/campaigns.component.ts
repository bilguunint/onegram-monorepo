import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, ModalModule],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  campaigns: any[] = [];
  isLoading = false;

  selectedCampaign: any = null;
  tickets: any[] = [];
  ticketsLoading = false;
  modalRef?: BsModalRef;

  constructor(private modalService: BsModalService) {}

  ngOnInit(): void {
    this.fetchCampaigns();
  }

  async fetchCampaigns() {
    this.isLoading = true;
    try {
      const snapshot = await firebase.firestore().collection('marketing_campaigns').get();
      this.campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async openDetail(template: TemplateRef<any>, campaign: any) {
    this.selectedCampaign = campaign;
    this.tickets = [];
    this.ticketsLoading = true;
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });

    try {
      const snapshot = await firebase.firestore()
        .collection('marketing_campaigns')
        .doc(campaign.id)
        .collection('tickets')
        .get();
      this.tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      this.ticketsLoading = false;
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'active': return 'badge-soft-success';
      case 'ended': return 'badge-soft-danger';
      default: return 'badge-soft-warning';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Идэвхтэй';
      case 'ended': return 'Дууссан';
      default: return status;
    }
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '-';
    if (dateVal.toDate) {
      return dateVal.toDate().toLocaleString('mn-MN');
    }
    return new Date(dateVal).toLocaleString('mn-MN');
  }
}
