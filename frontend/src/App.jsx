import { useCallback, useEffect, useMemo, useState } from "react";
import { api, opportunityPayload } from "./api.js";
import Dialog from "./components/Dialog.jsx";
import Icon from "./components/Icon.jsx";
import OpportunityForm from "./components/OpportunityForm.jsx";

const repositoryUrl = "https://github.com/hassanbilal803-code/research_portal_";
function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
function Badge({ status }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  );
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState(null);
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState("");
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await api.list());
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(timer);
  }, [toast]);

  const open = records.filter((record) => record.status === "Open");
  const positions = open.reduce(
    (sum, record) => sum + record.available_positions,
    0,
  );
  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();
    return records
      .filter(
        (record) =>
          (status === "All" || record.status === status) &&
          [
            record.title,
            record.research_area,
            record.faculty_name,
            record.department,
            record.required_skills,
          ].some((text) => text.toLowerCase().includes(search)),
      )
      .sort((a, b) =>
        sort === "deadline"
          ? a.application_deadline.localeCompare(b.application_deadline) ||
            b.id - a.id
          : sort === "title"
            ? a.title.localeCompare(b.title)
            : b.id - a.id,
      );
  }, [records, status, query, sort]);

  function notify(message, type = "success") {
    setToast({ message, type });
  }
  function replace(saved) {
    setRecords((current) =>
      current.map((record) => (record.id === saved.id ? saved : record)),
    );
  }

  async function save(data) {
    if (form.record) {
      replace(await api.update(form.record.id, data));
      notify("Your changes have been saved.");
    } else {
      const saved = await api.create(data);
      setRecords((current) => [saved, ...current]);
      notify("Research opportunity created.");
    }
    setForm(null);
  }
  async function view(record) {
    setPending(`view-${record.id}`);
    try {
      setDetails(await api.get(record.id));
    } catch (failure) {
      notify(failure.message, "error");
    } finally {
      setPending("");
    }
  }
  async function toggle(record) {
    const next = record.status === "Open" ? "Closed" : "Open";
    setPending(`status-${record.id}`);
    try {
      replace(
        await api.update(record.id, {
          ...opportunityPayload(record),
          status: next,
        }),
      );
      notify(`Opportunity is now ${next.toLowerCase()}.`);
    } catch (failure) {
      notify(failure.message, "error");
    } finally {
      setPending("");
    }
  }
  async function remove() {
    setPending("delete");
    try {
      await api.remove(deleting.id);
      setRecords((current) =>
        current.filter((record) => record.id !== deleting.id),
      );
      setDeleting(null);
      notify("Research opportunity deleted.");
    } catch (failure) {
      notify(failure.message, "error");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="Research Desk home">
          <span className="brand-mark">
            <Icon name="book" size={24} />
          </span>
          <span>
            Research Desk<small>UNIVERSITY PORTAL</small>
          </span>
        </a>
        <p className="sidebar-caption">WORKSPACE</p>
        <a href="#opportunities" className="sidebar-active">
          <Icon name="book" />
          Opportunities <span>{records.length}</span>
        </a>
        <a
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="sidebar-link"
        >
          <Icon name="external" />
          Project repository
        </a>
        <div className="sidebar-note">
          <span className="note-mark">↗</span>
          <h3>Make room for discovery.</h3>
          <p>
            Connect students with the projects that move your research forward.
          </p>
        </div>
        <div className="workspace-person">
          <span className="person-monogram">HB</span>
          <div>
            <strong>Hassan Bilal</strong>
            <small>Research workspace</small>
          </div>
        </div>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <span>
            Workspace <span className="crumb-divider">/</span>{" "}
            <strong>Opportunities</strong>
          </span>
          <span className={`connection ${error ? "connection-error" : ""}`}>
            <span />
            {loading
              ? "Connecting…"
              : error
                ? "Server unavailable"
                : "Database connected"}
          </span>
        </header>
        <main id="opportunities">
          <section className="page-heading">
            <div>
              <p className="eyebrow">YOUR NEXT COLLABORATION STARTS HERE</p>
              <h1>Research opportunities</h1>
              <p>
                One workspace to publish, explore, and manage your research
                openings.
              </p>
            </div>
            <button
              className="button button-primary"
              onClick={() => setForm({ record: null })}
            >
              <Icon name="plus" />
              New opportunity
            </button>
          </section>
          <section className="stats" aria-label="Opportunity statistics">
            <div>
              <span className="stat-label">
                Total opportunities
                <Icon name="book" />
              </span>
              <strong>{error ? "—" : records.length}</strong>
              <small>Across all research areas</small>
            </div>
            <div>
              <span className="stat-label">
                Open opportunities
                <Icon name="check" />
              </span>
              <strong>{error ? "—" : open.length}</strong>
              <small>Accepting new applications</small>
            </div>
            <div>
              <span className="stat-label">
                Available positions
                <Icon name="people" />
              </span>
              <strong>{error ? "—" : positions}</strong>
              <small>Across open opportunities</small>
            </div>
          </section>
          <section className="board" aria-labelledby="board-title">
            <div className="board-heading">
              <div>
                <h2 id="board-title">
                  Opportunity directory <span>{records.length}</span>
                </h2>
                <p>Keep every project and its application details together.</p>
              </div>
              <button
                className="button button-secondary button-small"
                onClick={load}
                disabled={loading || Boolean(pending)}
              >
                <Icon name="refresh" />
                Refresh
              </button>
            </div>
            <div className="toolbar">
              <label className="search-box">
                <Icon name="search" />
                <input
                  aria-label="Search opportunities"
                  type="search"
                  placeholder="Search research, skills, or faculty…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="select-control">
                <span>Status</span>
                <select
                  aria-label="Filter opportunities by status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option>All</option>
                  <option>Open</option>
                  <option>Closed</option>
                </select>
              </label>
              <label className="select-control">
                <span>Sort</span>
                <select
                  aria-label="Sort opportunities"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="deadline">Deadline</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            </div>
            {loading ? (
              <div className="empty-state" role="status">
                <span className="spinner" />
                <h3>Loading opportunities</h3>
                <p>Getting the latest records from the research database.</p>
              </div>
            ) : error ? (
              <div className="empty-state" role="alert">
                <Icon name="refresh" size={30} />
                <h3>We couldn’t load the directory</h3>
                <p>{error}</p>
                <button className="button button-primary" onClick={load}>
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <span className="empty-symbol">
                  <Icon name="book" size={32} />
                </span>
                <h3>
                  {records.length
                    ? "No opportunities match your search"
                    : "Start with your first opportunity"}
                </h3>
                <p>
                  {records.length
                    ? "Try a different keyword or status."
                    : "Create a research opening to help students find their next project."}
                </p>
                <button
                  className="button button-primary"
                  onClick={() =>
                    records.length
                      ? (setQuery(""), setStatus("All"))
                      : setForm({ record: null })
                  }
                >
                  {records.length ? "Clear filters" : "Create opportunity"}
                </button>
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">
                    Research opportunities with faculty, positions, deadlines,
                    status, and management actions.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Research opportunity</th>
                      <th scope="col">Faculty & department</th>
                      <th scope="col">Positions</th>
                      <th scope="col">Deadline</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record) => (
                      <tr key={record.id}>
                        <td className="research-cell">
                          <span className="area-label">
                            {record.research_area}
                          </span>
                          <button
                            className="record-title"
                            onClick={() => view(record)}
                            disabled={Boolean(pending)}
                          >
                            {record.title}
                          </button>
                          <p>{record.required_skills}</p>
                        </td>
                        <td data-label="Faculty">
                          <strong className="faculty-name">
                            {record.faculty_name}
                          </strong>
                          <span className="department">
                            {record.department}
                          </span>
                        </td>
                        <td data-label="Positions">
                          <span className="position-count">
                            {record.available_positions}
                          </span>
                        </td>
                        <td data-label="Deadline">
                          <span className="deadline">
                            {formatDate(record.application_deadline)}
                          </span>
                        </td>
                        <td data-label="Status">
                          <Badge status={record.status} />
                        </td>
                        <td className="actions-cell">
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              aria-label={`View ${record.title}`}
                              title="View complete details"
                              onClick={() => view(record)}
                              disabled={Boolean(pending)}
                            >
                              <Icon name="external" size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Edit ${record.title}`}
                              title="Edit opportunity"
                              onClick={() => setForm({ record })}
                              disabled={Boolean(pending)}
                            >
                              <Icon name="edit" size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`${record.status === "Open" ? "Close" : "Reopen"} ${record.title}`}
                              title={
                                record.status === "Open"
                                  ? "Close opportunity"
                                  : "Reopen opportunity"
                              }
                              onClick={() => toggle(record)}
                              disabled={Boolean(pending)}
                            >
                              <Icon
                                name={
                                  record.status === "Open" ? "lock" : "check"
                                }
                                size={17}
                              />
                            </button>
                            <button
                              className="icon-button delete-button"
                              aria-label={`Delete ${record.title}`}
                              title="Delete opportunity"
                              onClick={() => setDeleting(record)}
                              disabled={Boolean(pending)}
                            >
                              <Icon name="trash" size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && (
              <footer className="board-footer">
                <span>
                  Showing {filtered.length} of {records.length} opportunities
                </span>
                <span>Changes are stored in the research database.</span>
              </footer>
            )}
          </section>
          <footer className="site-footer">
            <strong>Research Desk</strong>
            <span>Good ideas deserve the right team.</span>
            <a href={repositoryUrl} target="_blank" rel="noreferrer">
              View project <Icon name="external" size={13} />
            </a>
          </footer>
        </main>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <Icon name={toast.type === "error" ? "close" : "check"} />
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        )}
      </div>
      {form && (
        <OpportunityForm
          record={form.record}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
      {details && (
        <Dialog
          title={details.title}
          subtitle={details.research_area}
          onClose={() => setDetails(null)}
        >
          <div className="detail-body">
            <div className="detail-heading">
              <Badge status={details.status} />
              <span>Record #{details.id}</span>
            </div>
            <h3>Research description</h3>
            <p className="detail-description">{details.description}</p>
            <dl className="detail-grid">
              <div>
                <dt>Faculty member</dt>
                <dd>{details.faculty_name}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{details.department}</dd>
              </div>
              <div>
                <dt>Positions</dt>
                <dd>{details.available_positions}</dd>
              </div>
              <div>
                <dt>Application deadline</dt>
                <dd>{formatDate(details.application_deadline)}</dd>
              </div>
              <div className="field-wide">
                <dt>Required skills</dt>
                <dd>{details.required_skills}</dd>
              </div>
            </dl>
          </div>
          <footer className="dialog-footer">
            <button
              className="button button-secondary"
              onClick={() => setDetails(null)}
            >
              Close
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                setForm({ record: details });
                setDetails(null);
              }}
            >
              <Icon name="edit" />
              Edit opportunity
            </button>
          </footer>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title="Delete research opportunity?"
          subtitle="The record will be permanently removed from the database."
          onClose={() => setDeleting(null)}
          busy={pending === "delete"}
          compact
        >
          <div className="delete-content">
            <span className="delete-symbol">
              <Icon name="trash" size={26} />
            </span>
            <h3>{deleting.title}</h3>
            <p>
              Close the opportunity if you want to keep it for reference. Delete
              it only when you no longer need the record.
            </p>
          </div>
          <footer className="dialog-footer">
            <button
              className="button button-secondary"
              onClick={() => setDeleting(null)}
              disabled={pending === "delete"}
            >
              Cancel
            </button>
            <button
              className="button button-danger"
              onClick={remove}
              disabled={pending === "delete"}
            >
              <Icon name="trash" />
              {pending === "delete" ? "Deleting…" : "Delete opportunity"}
            </button>
          </footer>
        </Dialog>
      )}
    </div>
  );
}
