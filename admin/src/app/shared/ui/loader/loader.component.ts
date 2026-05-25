import { Component, OnInit } from '@angular/core';
import { LoaderService } from "../../../core/services/loader.service";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  standalone:true,
  imports:[CommonModule]
})
export class LoaderComponent implements OnInit {

  loading: boolean = false;

  constructor(private loaderService: LoaderService) {
    this.loaderService.isLoading.subscribe((v) => {
      this.loading = v;
    });
  }
  
  ngOnInit(): void {
  }

}
