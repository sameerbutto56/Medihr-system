export default function DataTable({ columns, rows, emptyMsg = 'No records found.', onRowClick }) {
  return (
    <div className="table-wrap card">
      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{emptyMsg}</h3>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key ?? col.label} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={row.id ?? ri}
                onClick={() => onRowClick?.(row)}
                style={onRowClick ? { cursor: 'pointer' } : {}}
              >
                {columns.map((col) => (
                  <td key={col.key ?? col.label}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
