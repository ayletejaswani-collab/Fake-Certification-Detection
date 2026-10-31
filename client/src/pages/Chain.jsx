import { useEffect, useState } from "react";
import api from "../api/client";

export default function Chain() {
  const [data, setData] = useState(null);
  const [eth, setEth] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [overview, status] = await Promise.all([
      api.get("/api/analytics/overview"),
      api.get("/api/ethereum/status"),
    ]);
    setData(overview.data);
    setEth(status.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function stamp(certId) {
    setBusy(certId);
    setMsg("");
    try {
      const { data: result } = await api.post(`/api/ethereum/${certId}/stamp`);
      if (result.published) setMsg(`Stamped on Sepolia: ${result.txHash}`);
      else if (result.already) setMsg("Already stamped.");
      else setMsg(result.reason || "Stamp failed");
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    } finally {
      setBusy("");
    }
  }

  if (!data || !eth) return <p className="text-neutral-400">Loading ledger…</p>;

  return (
    <div>
      <h1 className="page-title">Immutable ledger</h1>
      <p className="muted mt-1 max-w-2xl">
        Dual record: a local proof-of-work chain, plus a real Ethereum Sepolia stamp that anyone can
        open on Etherscan.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#baff39]">Local chain</p>
          <p className="mt-2 text-xl font-bold text-white">
            {data.chain.integrity.valid ? "Intact" : "Compromised"} · {data.chain.integrity.length} blocks
          </p>
          <p className="muted mt-2">Mined at difficulty 3. Each certificate hash is linked to the previous block.</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#baff39]">Ethereum Sepolia</p>
          <p className="mt-2 text-xl font-bold text-white">
            {eth.ready ? "Ready to stamp" : eth.enabled ? "Wallet needs test ETH" : "Wallet created on first stamp"}
          </p>
          <p className="muted mt-2 break-all">
            Mode: {eth.mode} · Network: {eth.network}
            {eth.address ? ` · ${eth.address}` : ""}
            {eth.balanceEth != null ? ` · ${eth.balanceEth} ETH` : ""}
          </p>
          {eth.address && Number(eth.balanceEth) === 0 && (
            <a className="btn-lime mt-4" href={eth.faucet} target="_blank" rel="noreferrer">
              Get free Sepolia ETH
            </a>
          )}
          {eth.contract && (
            <a
              className="mt-3 block text-sm text-[#baff39]"
              href={`${eth.explorer}/address/${eth.contract}`}
              target="_blank"
              rel="noreferrer"
            >
              Open contract on Etherscan
            </a>
          )}
        </div>
      </div>

      {msg && <p className="mt-4 text-sm text-[#baff39]">{msg}</p>}

      <h2 className="mt-10 text-lg font-extrabold uppercase text-white">On-chain stamps</h2>
      <StampList onStamp={stamp} busy={busy} />

      <h2 className="mt-10 text-lg font-extrabold uppercase text-white">Local blocks</h2>
      <div className="mt-4 space-y-3">
        {data.chain.blocks.map((b) => (
          <article key={b._id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Block #{b.index}</h3>
              <span className="text-xs text-neutral-500">{new Date(b.timestamp).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-300">{b.certId}</p>
            <p className="mt-3 break-all font-mono text-xs text-neutral-400">{b.blockHash}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function StampList({ onStamp, busy }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/api/certificates").then((res) => setItems(res.data.certificates));
  }, [busy]);

  return (
    <div className="card mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-neutral-500">
          <tr>
            <th className="px-4 py-3">Certificate</th>
            <th className="px-4 py-3">Sepolia tx</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.certId} className="border-t border-white/10">
              <td className="px-4 py-3">
                <p className="font-mono text-xs text-white">{c.certId}</p>
                <p className="text-neutral-400">{c.name}</p>
              </td>
              <td className="px-4 py-3">
                {c.ethTxHash ? (
                  <a
                    className="break-all font-mono text-xs text-[#baff39]"
                    href={`https://sepolia.etherscan.io/tx/${c.ethTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {c.ethTxHash.slice(0, 18)}… open
                  </a>
                ) : (
                  <span className="text-neutral-500">Not stamped</span>
                )}
              </td>
              <td className="px-4 py-3">
                {!c.ethTxHash && (
                  <button className="btn-lime py-2" disabled={busy === c.certId} onClick={() => onStamp(c.certId)}>
                    {busy === c.certId ? "Sending…" : "Stamp on Sepolia"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
