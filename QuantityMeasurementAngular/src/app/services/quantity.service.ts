import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  QuantityDTO, QuantityOperationRequest, QuantityConvertRequest, MeasurementEntity
} from '../models/quantity.models';
 
@Injectable({ providedIn: 'root' })
export class QuantityService {
  private base = `${environment.apiUrl}/api/quantity`;
 
  constructor(private http: HttpClient) {}
 
  add(req: QuantityOperationRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.base}/add`, req);
  }
 
  subtract(req: QuantityOperationRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.base}/subtract`, req);
  }
 
  divide(req: QuantityOperationRequest): Observable<number> {
    return this.http.post<number>(`${this.base}/divide`, req);
  }
 
  compare(req: QuantityOperationRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.base}/compare`, req);
  }
 
  convert(req: QuantityConvertRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.base}/convert`, req);
  }
 
  getHistory(type: 'redis' | 'ef' | 'sql'): Observable<MeasurementEntity[]> {
    return this.http.get<MeasurementEntity[]>(`${this.base}/history/${type}`);
  }
}
