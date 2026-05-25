import { Component, OnInit } from '@angular/core';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { PagetitleComponent } from 'src/app/shared/ui/pagetitle/pagetitle.component';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  standalone:true,
  imports:[PagetitleComponent,CarouselModule],
})

/**
 * UI-carousel component
 */
export class CarouselComponent implements OnInit {
  // bread crumb items
  breadCrumbItems: Array<{}>;
  showNavigationArrows: any;
  showNavigationIndicators: any;

  constructor() { }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'UI Elements' }, { label: 'Carousel', active: true }];
  }

}
