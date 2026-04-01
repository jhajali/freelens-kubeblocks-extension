import { Renderer } from "@freelensapp/extensions";

const {
  Component: { LocaleDate, ReactiveDuration },
} = Renderer;

export interface DurationAbsoluteTimestampProps {
  timestamp: string | undefined;
}

export const DurationAbsoluteTimestamp = ({ timestamp }: DurationAbsoluteTimestampProps) => {
  if (!timestamp) {
    return <>{"<unknown>"}</>;
  }

  return (
    <>
      <ReactiveDuration timestamp={timestamp} />
      {" ago "}
      (<LocaleDate date={timestamp} />)
    </>
  );
};
