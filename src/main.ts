import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
// main.ts o un archivo como chartjs-config.ts
import { Chart } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);


platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
