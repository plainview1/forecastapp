import { Component, Injectable, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter, catchError, map, startWith, switchMap } from 'rxjs/operators';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

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

  constructor(private forecastService: ForecastService) {}

  ngOnInit() {
    this.myControl.valueChanges.pipe(
      debounceTime(600),
      filter(value => !!value && value.length > 2),
      distinctUntilChanged()
    ).subscribe(value => this.handleSearch(value))
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
      this.forecastService.getForecastedWeather(event.option.value)
    ]).subscribe(([weatherData, forecastData]) => {
      this.$weather = of(weatherData);
      this.$forecast = of(forecastData);
    });
  }

  displayedColumns: string[] = ['dateTime', 'temperature', 'tempMin', 'tempMax', 'weatherDescription'];
}

@Injectable({
  providedIn: 'root',
})
export class ForecastService {
  private apiKey = `2d42a22d65658c13b1bf85a24c188eda`;
  private apiLink = `https://api.openweathermap.org/data/2.5`;

  constructor(private http: HttpClient) {
  }

  searchCitiesByName(cityName: string): Observable<any> {
    const url = `${this.apiLink}/find?q=${cityName}&appid=${this.apiKey}`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  getCurrentWeather(cityName: string): Observable<any> {
    return this.http.get(`${this.apiLink}/weather?q=${cityName}&appid=${this.apiKey}`).pipe(map((item: any) => {
      item.main.temp = Math.round(item.main.temp);
      return item;
    }))
  }

  getForecastedWeather(cityName: string): Observable<any> {
    const url = `${this.apiLink}/forecast?q=${cityName}&cnt=5&appid=${this.apiKey}`
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
