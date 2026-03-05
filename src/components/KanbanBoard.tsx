import "./KanbanBoard.css";

const COLUMNS = [
  { id: 'new', title: 'New', emoji: '🆕' },
  { id: 'interested', title: 'Interested', emoji: '👀' },
  { id: 'touring', title: 'Touring', emoji: '🚶' },
  { id: 'applied', title: 'Applied', emoji: '📝' },
  { id: 'rejected', title: 'Passed', emoji: '❌' },
];

interface Listing {
  _id: string;
  price: number;
  address: string;
  bedrooms: number;
  neighborhood: string;
  noFee?: boolean;
  status: string;
  url?: string;
}

export default function KanbanBoard() {
  // TODO: Replace with D1/Workers API calls
  const listings: Listing[] = [];
  const updateStatus = async (_args: { id: string; status: string }) => {};

  const handleStatusUpdate = async (listingId: string, newStatus: string) => {
    try {
      await updateStatus({ id: listingId, status: newStatus });
    } catch (error) {
      console.error("Failed to update listing status:", error);
    }
  };

  const getListingsForColumn = (columnId: string) => {
    return listings.filter((listing: Listing) => listing.status === columnId);
  };

  return (
    <div className="kanban-board">
      <h1 className="kanban-title">StreetEasy Apartment Tracker</h1>
      <div className="kanban-columns">
        {COLUMNS.map((column) => (
          <div key={column.id} className="kanban-column">
            <div className="column-header">
              <span className="column-emoji">{column.emoji}</span>
              <h2 className="column-title">{column.title}</h2>
              <span className="column-count">
                {getListingsForColumn(column.id).length}
              </span>
            </div>
            <div className="column-content">
              {getListingsForColumn(column.id).map((listing: Listing) => (
                <div key={listing._id} className="listing-card">
                  <div className="listing-price">
                    ${listing.price.toLocaleString()}/mo
                  </div>
                  <div className="listing-address">{listing.address}</div>
                  <div className="listing-details">
                    {listing.bedrooms} BR · {listing.neighborhood}
                  </div>
                  {listing.noFee && (
                    <div className="no-fee-badge">No Fee</div>
                  )}
                  <div className="listing-actions">
                    {COLUMNS.map((col) => 
                      col.id !== column.id ? (
                        <button
                          key={col.id}
                          className="move-button"
                          onClick={() => handleStatusUpdate(listing._id, col.id)}
                          title={`Move to ${col.title}`}
                        >
                          {col.emoji}
                        </button>
                      ) : null
                    )}
                  </div>
                  {listing.url && (
                    <a 
                      href={listing.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-link"
                    >
                      View Listing
                    </a>
                  )}
                </div>
              ))}
              {getListingsForColumn(column.id).length === 0 && (
                <div className="empty-column">No listings</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
