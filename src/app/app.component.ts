import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ForecastService } from './forecast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  myControl = new FormControl('');
  $filteredOptions: Observable<any[]>;
  $weather: Observable<any>;
  $forecast: Observable<any>;
  displayedColumns: string[] = [
    'dateTime',
    'temperature',
    'tempMin',
    'tempMax',
    'weatherDescription',
  ];

  constructor(private forecastService: ForecastService) {}

  ngOnInit() {
    this.myControl.valueChanges
      .pipe(
        debounceTime(600),
        filter((value) => !!value && value.length > 2),
        distinctUntilChanged()
      )
      .subscribe((value) => this.handleSearch(value));
  }

  private handleSearch(value: string): void {
    if (value.trim() !== '') {
      this.forecastService.searchCitiesByName(value).subscribe((res) => {
        this.$filteredOptions = of(res.list);
        if (res.list.length === 0) {
          this.myControl.setErrors({ noResults: true });
        } else {
          this.myControl.setErrors(null);
        }
      });
    }
  }

  optionSelected(event: MatAutocompleteSelectedEvent): void {
    forkJoin([
      this.forecastService.getCurrentWeather(event.option.value),
      this.forecastService.getForecastedWeather(event.option.value),
    ]).subscribe(([weatherData, forecastData]) => {
      this.$weather = of(weatherData);
      this.$forecast = of(forecastData);
    });
  }
}
