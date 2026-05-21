type MantleTrackerProps = {
  appToken: string;
  customerId: string;
};

export function MantleTracker({ appToken, customerId }: MantleTrackerProps) {
  const mantleConfig = JSON.stringify({
    appToken,
    customerId,
  });

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.mantleConfig = ${mantleConfig};`,
        }}
      />
      <script
        async
        src="https://cdn.heymantle.com/mantle_track.js"
      />
    </>
  );
}
