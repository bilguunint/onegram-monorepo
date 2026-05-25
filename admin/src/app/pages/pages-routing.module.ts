import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CalendarComponent } from './calendar/calendar.component';
import { ChatComponent } from './chat/chat.component';
import { DefaultComponent } from './dashboards/default/default.component';
import { FilemanagerComponent } from './filemanager/filemanager.component';
import { UsersComponent } from './users/users.component';
import { OrdersComponent } from './orders/orders.component';
import { GiftOrdersComponent } from './gift-orders/gift-orders.component';
import { InvestmentsComponent } from './investments/investments.component';
import { WithdrawsComponent } from './withdraws/withdraws.component';
import { WithdrawsStatisticsComponent } from './withdraws-statistics/withdraws-statistics.component';
import { MessagingComponent } from './messaging/messaging.component';
import { SendMessageComponent } from './send-message/send-message.component';
import { CampaignsComponent } from './campaigns/campaigns.component';
import { CustomNotificationsComponent } from './custom-notifications/custom-notifications.component';
import { SendCustomNotificationComponent } from './send-custom-notification/send-custom-notification.component';
import { AiWorkerComponent } from './ai-worker/ai-worker.component';
import { RoleRedirectGuard } from '../core/guards/role-redirect.guard';

const routes: Routes = [
  // { path: '', redirectTo: 'dashboard' },
  {
    path: "",
    component: DefaultComponent,
    canActivate: [RoleRedirectGuard]
  },
  { 
    path: 'dashboard', 
    component: DefaultComponent,
    canActivate: [RoleRedirectGuard]
  },
  { path: 'users', component: UsersComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'gift_orders', component: GiftOrdersComponent },
  { path: 'investments', component: InvestmentsComponent },
  { path: 'withdraws', component: WithdrawsComponent },
  { path: 'withdraws_statistics', component: WithdrawsStatisticsComponent },
  { path: 'messaging', component: MessagingComponent },
  { path: 'send-message', component: SendMessageComponent },
  { path: 'campaigns', component: CampaignsComponent },
  { path: 'custom-notifications', component: CustomNotificationsComponent },
  { path: 'send-custom-notification', component: SendCustomNotificationComponent },
  { path: 'ai-worker', component: AiWorkerComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'filemanager', component: FilemanagerComponent },
  { path: 'dashboards', loadChildren: () => import('./dashboards/dashboards.module').then(m => m.DashboardsModule) },
  { path: 'ecommerce', loadChildren: () => import('./ecommerce/ecommerce.module').then(m => m.EcommerceModule) },
  { path: 'crypto', loadChildren: () => import('./crypto/crypto.module').then(m => m.CryptoModule) },
  { path: 'email', loadChildren: () => import('./email/email.module').then(m => m.EmailModule) },
  { path: 'invoices', loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule) },
  { path: 'projects', loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule) },
  { path: 'tasks', loadChildren: () => import('./tasks/tasks.module').then(m => m.TasksModule) },
  { path: 'contacts', loadChildren: () => import('./contacts/contacts.module').then(m => m.ContactsModule) },
  { path: 'blog', loadChildren: () => import('./blog/blog.module').then(m => m.BlogModule) },
  { path: 'pages', loadChildren: () => import('./utility/utility.module').then(m => m.UtilityModule) },
  { path: 'ui', loadChildren: () => import('./ui/ui.module').then(m => m.UiModule) },
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'tables', loadChildren: () => import('./tables/tables.module').then(m => m.TablesModule) },
  { path: 'icons', loadChildren: () => import('./icons/icons.module').then(m => m.IconsModule) },
  { path: 'charts', loadChildren: () => import('./chart/chart.module').then(m => m.ChartModule) },
  { path: 'maps', loadChildren: () => import('./maps/maps.module').then(m => m.MapsModule) },
  { path: 'jobs', loadChildren: () => import('./jobs/jobs.module').then(m => m.JobsModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
