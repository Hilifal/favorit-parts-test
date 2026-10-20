import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchManufacturers, fetchAnalogues } from "./store/searchSlice";
import "./App.css";

function OffersTable({ parts }) {
  const formatPrice = (price) => {
    if (price == null || Number(price) <= 0) return "—";

    return `${Number(price).toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ₽`;
  };

  const offers = parts
    .filter((part) => part?.brand && part?.number)
    .flatMap((part) =>
      part.warehouses?.length
        ? part.warehouses.map((warehouse) => ({
            part,
            warehouse,
          }))
        : [{ part, warehouse: null }],
    );

  if (!offers.length) {
    return <div className="empty-state">Предложения не найдены</div>;
  }

  return (
    <div className="parts-table-wrap">
      <table className="parts-table">
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Производитель</th>
            <th>Склад</th>
            <th>Цена</th>
            <th>Остаток</th>
          </tr>
        </thead>

        <tbody>
          {offers.map(({ part, warehouse }, index) => {
            const stock = warehouse?.stock ?? 0;

            return (
              <tr key={index}>
                <td data-label="Наименование">
                  <div className="part-name">{part.name || "Без названия"}</div>
                  <span className="part-number">Арт. {part.number}</span>
                </td>

                <td data-label="Производитель">
                  <span className="part-brand">{part.brand}</span>
                </td>

                <td data-label="Склад">
                  {warehouse?.code || warehouse?.id || "—"}
                </td>

                <td data-label="Цена">
                  <span className="part-price">
                    {formatPrice(warehouse?.price)}
                  </span>
                </td>

                <td data-label="Остаток">
                  <span
                    className={
                      stock > 0 ? "stock-available" : "stock-unavailable"
                    }
                  >
                    {stock > 0 ? `${stock} шт.` : "Нет в наличии"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [number, setNumber] = useState("");
  const [searchedNumber, setSearchedNumber] = useState("");

  const dispatch = useDispatch();

  const {
    manufacturers,
    loading,
    error,
    selectedBrand,
    analogues,
    analoguesLoading,
    analoguesError,
  } = useSelector((state) => state.search);

  useEffect(() => {
    const article = number.trim();

    if (!article) return;

    const timeout = setTimeout(() => {
      setSearchedNumber(article);
      dispatch(fetchManufacturers(article));
    }, 1200);

    return () => clearTimeout(timeout);
  }, [number, dispatch]);

  const handleNumberChange = (event) => {
    setNumber(event.target.value);
    setSearchedNumber("");
  };

  const handleBrandSelect = (brand) => {
    if (analoguesLoading) return;

    dispatch(
      fetchAnalogues({
        number: searchedNumber,
        brand,
      }),
    );
  };

  const showResults =
    Boolean(searchedNumber) && number.trim() === searchedNumber;

  const originalParts = analogues.filter((part) => !part.isAnalogue);

  const analogueParts = analogues.filter((part) => part.isAnalogue);

  const showOffers =
    showResults &&
    !loading &&
    !error &&
    !analoguesLoading &&
    !analoguesError &&
    selectedBrand;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="layout header-content">
          <img src="/logo.svg" alt="Favorit Parts" className="site-logo" />

          <span className="header-caption">Поиск запчастей и аналогов</span>
        </div>
      </header>

      <main className="layout main-content">
        <div className="page-heading">
          <span className="page-caption">КАТАЛОГ АВТОЗАПЧАСТЕЙ</span>

          <h1>Поиск автозапчастей</h1>

          <p>
            Найдите необходимую деталь по артикулу, выберите производителя и
            сравните доступные предложения.
          </p>
        </div>

        <section className="panel search-panel">
          <div className="section-heading">
            <span className="step-number">01</span>

            <div>
              <h2>Поиск детали</h2>
              <p>Укажите артикул автозапчасти</p>
            </div>
          </div>

          <label htmlFor="article" className="field-label">
            Артикул детали
          </label>

          <div className="search-field">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              id="article"
              type="text"
              placeholder="Например: 7160500039S"
              value={number}
              onChange={handleNumberChange}
              autoComplete="off"
            />

            {number && (
              <button
                type="button"
                className="clear-button"
                onClick={() => {
                  setNumber("");
                  setSearchedNumber("");
                }}
                aria-label="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {showResults && loading && (
          <div className="feedback-message" role="status">
            <div
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
            Поиск производителей...
          </div>
        )}

        {showResults && error && (
          <div className="feedback-message error-message" role="alert">
            Не удалось выполнить поиск. Попробуйте позже.
          </div>
        )}

        {showResults && !loading && !error && manufacturers.length > 0 && (
          <section className="panel manufacturers-panel">
            <div className="section-heading">
              <span className="step-number">02</span>

              <div>
                <h2>Выберите производителя</h2>
                <p>Найдено производителей: {manufacturers.length}</p>
              </div>
            </div>

            <div className="manufacturers-list">
              {manufacturers.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className={`manufacturer-button ${
                    selectedBrand === brand ? "selected" : ""
                  }`}
                  disabled={analoguesLoading}
                  onClick={() => handleBrandSelect(brand)}
                >
                  {brand}
                </button>
              ))}
            </div>
          </section>
        )}

        {showResults && !loading && !error && manufacturers.length === 0 && (
          <div className="feedback-message">
            По этому артикулу производители не найдены. Проверьте номер детали.
          </div>
        )}

        {showResults && analoguesLoading && (
          <div className="feedback-message" role="status">
            <div
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
            Загрузка предложений...
          </div>
        )}

        {showResults && analoguesError && (
          <div className="feedback-message error-message" role="alert">
            Не удалось получить предложения. Попробуйте позже.
          </div>
        )}

        {showOffers && (
          <div className="results-container">
            <section className="panel results-panel">
              <div className="results-heading">
                <div>
                  <span className="results-caption">РЕЗУЛЬТАТ ПОИСКА</span>
                  <h2>Искомая деталь</h2>
                  <p>Производитель: {selectedBrand}</p>
                </div>

                <span className="results-tag">{originalParts.length} поз.</span>
              </div>

              <OffersTable parts={originalParts} />
            </section>

            <section className="panel results-panel">
              <div className="results-heading">
                <div>
                  <span className="results-caption">ПОДХОДЯЩИЕ ЗАМЕНЫ</span>
                  <h2>Аналоги</h2>
                  <p>Найденные аналогичные детали</p>
                </div>

                <span className="results-tag">{analogueParts.length} поз.</span>
              </div>

              <OffersTable parts={analogueParts} />
            </section>

            <p className="results-note">
              Цены и остатки указаны для конкретных складов.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
