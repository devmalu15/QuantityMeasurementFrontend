
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuantityService } from '../../services/quantity.service';
import { QuantityDTO, MeasurementEntity } from '../../models/quantity.models';

// Unit groups — same concept as UC19 but typed
const UNIT_GROUPS: { [key: string]: string[] } = {
  Length: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  Weight: ['KILOGRAM', 'GRAM', 'POUND'],
  Volume: ['LITRE', 'MILLILITRE', 'GALLON'],
  Temperature: ['CELSIUS', 'FAHRENHEIT'],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // Unit data for dropdowns
  unitGroups = UNIT_GROUPS;
  unit2Options: string[] = [];

  // Operation state
  opType = 'add';
  val1 = '';
  unit1 = 'FEET';
  val2 = '';
  unit2 = 'FEET';
  opResult = '';
  opError = '';
  opLoading = false;

  // Convert state
  cvtVal = '';
  cvtFrom = 'FEET';
  cvtTo = 'INCHES';
  cvtResult = '';
  cvtError = '';
  cvtLoading = false;

  // History state
  history: MeasurementEntity[] = [];
  historyLoading = false;
  historyError = '';
  historyType = '';

  constructor(private qty: QuantityService) { }

  ngOnInit(): void {
    this.syncUnit2();   // lifecycle hook — runs after component initialises
  }

  // Get all unit values flat for select dropdown
  getAllUnits(): string[] {
    return Object.values(this.unitGroups).flat();
  }

  getGroupForUnit(unit: string): string | null {
    return Object.entries(this.unitGroups)
      .find(([, units]) => units.includes(unit))?.[0] ?? null;
  }

  syncUnit2(): void {
    const group = this.getGroupForUnit(this.unit1);
    this.unit2Options = group ? this.unitGroups[group] : [];
    if (!this.unit2Options.includes(this.unit2)) {
      this.unit2 = this.unit2Options[0] ?? '';
    }
  }

  toLabel(unit: string): string {
    return unit.charAt(0) + unit.slice(1).toLowerCase();
  }

  runOperation(): void {
    if (!this.val1 || !this.val2) {
      this.opError = 'Please enter both values'; return;
    }
    const v1 = parseFloat(this.val1);
    const v2 = parseFloat(this.val2);
    if (isNaN(v1) || isNaN(v2)) {
      this.opError = 'Values must be valid numbers'; return;
    }

    const q1: QuantityDTO = { value: v1, unit: this.unit1 };
    const q2: QuantityDTO = { value: v2, unit: this.unit2 };
    const req = { q1, q2 };

    this.opLoading = true;
    this.opResult = '';
    this.opError = '';

    const handleResult = (res: any) => {
      this.opLoading = false;
      if (typeof res === 'boolean') this.opResult = `Equal: ${res}`;
      else if (typeof res === 'number') this.opResult = `Result: ${res}`;
      else this.opResult = `${res.value} ${this.toLabel(res.unit)}`;
    };

    const handleError = (err: any) => {
      this.opLoading = false;
      this.opError = err.error ?? 'Operation failed';
    };

    // Each branch subscribes independently — no union type issue
    if (this.opType === 'add') this.qty.add(req).subscribe({ next: handleResult, error: handleError });
    else if (this.opType === 'subtract') this.qty.subtract(req).subscribe({ next: handleResult, error: handleError });
    else if (this.opType === 'divide') this.qty.divide(req).subscribe({ next: handleResult, error: handleError });
    else this.qty.compare(req).subscribe({ next: handleResult, error: handleError });
  }
  runConvert(): void {
    if (!this.cvtVal) { this.cvtError = 'Please enter a value'; return; }
    const v = parseFloat(this.cvtVal);
    if (isNaN(v)) { this.cvtError = 'Value must be a valid number'; return; }

    this.cvtLoading = true;
    this.cvtResult = '';
    this.cvtError = '';

    this.qty.convert({ input: { value: v, unit: this.cvtFrom }, targetUnit: this.cvtTo })
      .subscribe({
        next: (res) => {
          this.cvtLoading = false;
          this.cvtResult = `${res.value} ${this.toLabel(res.unit)}`;
        },
        error: (err) => {
          this.cvtLoading = false;
          this.cvtError = err.error ?? 'Conversion failed';
        }
      });
  }

  loadHistory(type: 'redis' | 'ef'): void {
    this.historyLoading = true;
    this.historyError = '';
    this.historyType = type;
    this.history = [];

    this.qty.getHistory(type).subscribe({
      next: (data) => {
        this.historyLoading = false;
        this.history = data;
      },
      error: (err) => {
        this.historyLoading = false;
        this.historyError = err.error ?? 'Failed to load history';
      }
    });
  }
}
