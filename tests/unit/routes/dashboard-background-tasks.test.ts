import { queueDashboardBackgroundTask } from "../../../app/routes/app/app.dashboard/dashboard-background-tasks.server";

describe("dashboard background tasks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("defers non-critical work until after the current loader turn", () => {
    const task = jest.fn();

    queueDashboardBackgroundTask(task);

    expect(task).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    expect(task).toHaveBeenCalledTimes(1);
  });
});
