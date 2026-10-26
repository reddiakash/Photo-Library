import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import useFetchPhotos from './hooks/useFetchPhotos';

// Read saved favourites from localStorage.
function getInitialFavourites() {
  try {
    const saved = localStorage.getItem('celebrare-favourites');

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Reducer to manage favourite photos.
function favouritesReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_FAVOURITE': {
      const photoId = action.photoId;

      if (state.includes(photoId)) {
        return state.filter((id) => id !== photoId);
      }

      return [...state, photoId];
    }

    default:
      return state;
  }
}

export default function App() {
  // Custom hook fetches the photos.
  const { photos, loading, error } = useFetchPhotos();

  // Search text.
  const [search, setSearch] = useState('');

  // Show all photos or only favourites.
  const [showFavourites, setShowFavourites] = useState(false);

  // Manage favourites using useReducer, as required.
  const [favourites, dispatch] = useReducer(
    favouritesReducer,
    undefined,
    getInitialFavourites
  );

  // Save favourites whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(
        'celebrare-favourites',
        JSON.stringify(favourites)
      );
    } catch (err) {
      console.error('Could not save favourites:', err);
    }
  }, [favourites]);

  // Handle search input.
  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  // Filter the already-fetched photos without another API request.
  const filteredPhotos = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return photos.filter((photo) => {
      const matchesAuthor = photo.author
        .toLowerCase()
        .includes(searchText);

      const matchesFavourite =
        !showFavourites || favourites.includes(photo.id);

      return matchesAuthor && matchesFavourite;
    });
  }, [photos, search, showFavourites, favourites]);

  // Toggle a photo's favourite status.
  const toggleFavourite = (photoId) => {
    dispatch({
      type: 'TOGGLE_FAVOURITE',
      photoId,
    });
  };

  return (
    <div className="app-shell min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="gallery-header border-b border-gray-200 bg-white">
        <div className="gallery-header-inner mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="gallery-eyebrow">A little inspiration, collected</p>
            <h1 className="gallery-title text-2xl font-bold tracking-tight sm:text-3xl">
              Photo Gallery
            </h1>

            <p className="gallery-subtitle mt-1 text-sm text-gray-500">
              Discover beautiful moments from around the world.
            </p>
          </div>

          <div className="gallery-favorites-count rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
            ♥ {favourites.length}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="gallery-main mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and filter */}
        <section className="gallery-toolbar mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <label
              htmlFor="photo-search"
              className="gallery-label mb-2 block text-sm font-semibold text-gray-700"
            >
              Search by author
            </label>

            <input
              id="photo-search"
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Enter an author's name..."
              className="gallery-search w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFavourites((current) => !current)}
            aria-pressed={showFavourites}
            className={`gallery-filter rounded-xl px-5 py-3 text-sm font-semibold transition ${
              showFavourites
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {showFavourites ? '♥ Show All Photos' : '♡ Show Favourites'}
          </button>
        </section>

        {/* Loading state */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-24"
            role="status"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-rose-600" />

            <p className="mt-4 text-gray-600">
              Loading beautiful photos...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
          >
            <p className="font-semibold text-red-700">
              Unable to load photos.
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error} Please check your internet connection and refresh
              the page.
            </p>
          </div>
        )}

        {/* Photo grid */}
        {!loading && !error && (
          <>
            <div className="gallery-meta mb-5 flex items-center justify-between">
              <p className="gallery-results text-sm text-gray-600">
                {filteredPhotos.length}{' '}
                {filteredPhotos.length === 1 ? 'photo' : 'photos'} found
              </p>

              <p className="gallery-view-label text-sm text-gray-500">
                {showFavourites ? 'Your favourites' : 'All photos'}
              </p>
            </div>

            {filteredPhotos.length > 0 ? (
              <div className="gallery-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredPhotos.map((photo) => {
                  const isFavourite = favourites.includes(photo.id);

                  return (
                    <article
                      key={photo.id}
                      className="gallery-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <img
                        src={`https://picsum.photos/id/${photo.id}/600/400`}
                        alt={`Photo by ${photo.author}`}
                        loading="lazy"
                        className="gallery-image h-56 w-full object-cover"
                      />

                      <div className="gallery-card-details flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            Photographer
                          </p>

                          <h2
                            className="gallery-author mt-1 truncate font-semibold text-gray-800"
                            title={photo.author}
                          >
                            {photo.author}
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFavourite(photo.id)}
                          aria-label={
                            isFavourite
                              ? `Remove ${photo.author} photo from favourites`
                              : `Add ${photo.author} photo to favourites`
                          }
                          aria-pressed={isFavourite}
                          className={`gallery-favorite flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-2xl transition ${
                            isFavourite
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : 'border-gray-200 bg-white text-gray-400 hover:border-rose-200 hover:text-rose-500'
                          }`}
                        >
                          {isFavourite ? '♥' : '♡'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  No photos found
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Try another author name or change your favourites
                  filter.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="gallery-footer mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          Built with React, Vite and Tailwind CSS
        </div>
      </footer>
    </div>
  );
}