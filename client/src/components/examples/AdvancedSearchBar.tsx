import AdvancedSearchBar from '../AdvancedSearchBar';

export default function AdvancedSearchBarExample() {
  return (
    <div className="p-8">
      <AdvancedSearchBar
        onSearch={(query, mode, filters) => {
          console.log('Search:', { query, mode, filters });
        }}
      />
    </div>
  );
}
