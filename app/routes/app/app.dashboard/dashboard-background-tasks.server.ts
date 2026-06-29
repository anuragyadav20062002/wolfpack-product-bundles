export function queueDashboardBackgroundTask(task: () => void | Promise<void>) {
  setTimeout(() => {
    void task();
  }, 0);
}
