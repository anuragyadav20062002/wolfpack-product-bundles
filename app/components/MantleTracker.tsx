type MantleTrackerProps = {
  customerId: string;
};

const MANTLE_APP_TOKEN = "162b02eb86751becaa2ff21b2757dd1f";

export function MantleTracker({ customerId }: MantleTrackerProps) {
  const mantleConfig = JSON.stringify({
    appToken: MANTLE_APP_TOKEN,
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
