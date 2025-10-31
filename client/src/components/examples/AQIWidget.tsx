import AQIWidget from '../AQIWidget';

export default function AQIWidgetExample() {
  return (
    <div className="p-8 max-w-md">
      <AQIWidget value={85} trend="down" location="Downtown Area" />
    </div>
  );
}
