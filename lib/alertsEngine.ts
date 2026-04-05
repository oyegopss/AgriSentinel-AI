/**
 * Generates automated alerts based on environmental factors.
 * Keeps logic simple and demo-friendly.
 */

export interface AlertMessage {
  id: string;
  type: "info" | "warning" | "critical";
  title: string;
  message: string;
}

export function generateWeatherAlerts(
  humidity: number, // percentage 0-100
  rain: number, // mm of rainfall
  temperature?: number // optional temperature in Celsius
): AlertMessage[] {
  const alerts: AlertMessage[] = [];

  // Fungal Risk Alerts based on Humidity
  if (humidity > 80) {
    alerts.push({
      id: "alert-humidity-fungal",
      type: "critical",
      title: "High Fungal Risk",
      message: `Humidity is extremely high at ${humidity}%. This creates an ideal environment for rapid fungal disease spread. Immediate preventative spraying advised.`
    });
  } else if (humidity > 65) {
     alerts.push({
      id: "alert-humidity-monitor",
      type: "warning",
      title: "Rising Humidity",
      message: `Humidity is rising (${humidity}%). Monitor crops closely for early signs of mildew or mold.`
    });
  }

  // Flood / Waterlogging Risk Alerts based on Rain
  if (rain > 50) {
    alerts.push({
      id: "alert-rain-heavy",
      type: "critical",
      title: "Heavy Rainfall Alert",
      message: `Severe rainfall (${rain}mm) expected. Check field drainage immediately to prevent prolonged waterlogging and root rot.`
    });
  } else if (rain > 10) {
     alerts.push({
      id: "alert-rain-moderate",
      type: "info",
      title: "Moderate Rainfall",
      message: `Moderate rain expected (${rain}mm). Consider pausing irrigation schedules to save resources.`
    });
  }

  // Temperature Risk Alerts
  if (temperature !== undefined) {
    if (temperature > 38) {
       alerts.push({
        id: "alert-heat-stress",
        type: "warning",
        title: "Heat Stress Warning",
        message: `High temperature (${temperature}°C). Ensure adequate irrigation to prevent crop heat stress and wilting.`
      });
    } else if (temperature < 10) {
       alerts.push({
        id: "alert-cold-stress",
        type: "warning",
        title: "Cold Stress Warning",
        message: `Low temperature (${temperature}°C). Sensitive crops may experience slowed growth. Consider protective covers if applicable.`
      });
    }
  }

  return alerts;
}
