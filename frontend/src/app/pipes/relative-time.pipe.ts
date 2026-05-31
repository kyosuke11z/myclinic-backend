import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thaiRelativeTime',
  standalone: true
})
export class ThaiRelativeTimePipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '-';
    
    let dateVal: Date;
    if (value instanceof Date) {
      dateVal = value;
    } else {
      const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
      dateVal = new Date(normalized);
    }
    
    if (isNaN(dateVal.getTime())) return value;
    
    const now = new Date();
    const diffMs = now.getTime() - dateVal.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMs < 0) {
      return 'กำลังจะมาถึง';
    }
    
    if (diffMins < 1) {
      return 'เมื่อสักครู่';
    }
    
    if (diffMins < 60) {
      return `เมื่อ ${diffMins} นาทีที่แล้ว`;
    }
    
    if (diffHours < 24) {
      return `เมื่อ ${diffHours} ชั่วโมงที่แล้ว`;
    }
    
    const daysDiff = Math.floor(diffHours / 24);
    if (daysDiff === 1) {
      return 'เมื่อวานนี้';
    }
    
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const day = dateVal.getDate();
    const month = thaiMonths[dateVal.getMonth()];
    const year = dateVal.getFullYear() + 543;
    
    return `เมื่อ ${day} ${month} ${year}`;
  }
}
