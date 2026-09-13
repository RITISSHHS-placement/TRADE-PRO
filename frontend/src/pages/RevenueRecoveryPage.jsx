import React, { useMemo, useState } from 'react'
import {
  AlertCircle, ArrowRight, Bot, Check, ChevronDown, Clock3, CreditCard,
  FileCheck2, FileText, Mail, MessageSquareText, PauseCircle, Play,
  ShieldCheck, Sparkles, UserRound, WalletCards,
} from 'lucide-react'
import { TitleBar, StatCard, StatGrid, Pill, DataTable, Section } from '../components/primitive'
import styles from './RevenueRecoveryPage.module.css'

const INITIAL_CASES = [
  { id: 'RCV-1048', name: 'Nisha Mehta', company: 'Atelier Nine', type: 'Payment failure', reason: 'Card issuer decline', amount: 18400, age: '2h ago', risk: 'High', channel: 'WhatsApp', next: 'Retry card in 4h', selected: true },
  { id: 'RCV-1047', name: 'Arjun Rao', company: 'Northstar Labs', type: 'Checkout drop-off', reason: 'Shipping step abandoned', amount: 12600, age: '5h ago', risk: 'Medium', channel: 'Email', next: 'Send recovery link' },
  { id: 'RCV-1046', name: 'Maya Kapoor', company: 'Maya Studio', type: 'Overdue invoice', reason: '14 days past due', amount: 48000, age: '1d ago', risk: 'High', channel: 'Email', next: 'Chase with promise-to-pay' },
  { id: 'RCV-1045', name: 'Rohan Shah', company: 'Shah & Co.', type: 'Failed subscription', reason: 'Insufficient funds', amount: 3200, age: '1d ago', risk: 'Low', channel: 'SMS', next: 'Retry mandate tomorrow' },
  { id: 'RCV-1044', name: 'Kavya Iyer', company: 'Orbit Commerce', type: 'Overdue invoice', reason: '7 days past due', amount: 27500, age: '2d ago', risk: 'Medium', channel: 'Voice', next: 'Call during local hours' },
]

const auditSeed = [
  { time: '09:42:18', text: 'Detected issuer decline on RCv-1048', kind: 'detect' },
  { time: '09:42:19', text: 'Policy check passed: retry limit 1/3', kind: 'check' },
  { time: '09:42:21', text: 'Recommended WhatsApp recovery in Hinglish', kind: 'recommend' },
]

const FILTERS = ['All at risk', 'Payment failure', 'Checkout drop-off', 'Overdue invoice', 'Failed subscription']
const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`
const riskVariant = (r) => ({ High: 'down', Medium: 'amber', Low: 'up' }[r] || 'muted')

function typeIcon(t) {
  if (t === 'Overdue invoice') return <FileText size={14} />
  if (t === 'Checkout drop-off') return <WalletCards size={14} />
  return <CreditCard size={14} />
}

export default function RevenueRecoveryPage() {
  const [cases, setCases] = useState(INITIAL_CASES)
  const [selectedId, setSelectedId] = useState('RCV-1048')
  const [filter, setFilter] = useState('All at risk')
  const [audit, setAudit] = useState(auditSeed)
  const [isRunning, setIsRunning] = useState(false)
  const [notice, setNotice] = useState('')

  const selected = useMemo(() => cases.find((c) => c.id === selectedId) || cases[0], [cases, selectedId])
  const visibleCases = useMemo(
    () => (filter === 'All at risk' ? cases : cases.filter((c) => c.type === filter)),
    [cases, filter]
  )
  const totalAtRisk = useMemo(() => cases.reduce((s, c) => s + c.amount, 0), [cases])
  const recovered = useMemo(() => cases.filter((c) => c.status === 'Recovered').reduce((s, c) => s + c.amount, 0), [cases])

  const runRecovery = () => {
    if (!selected || selected.status === 'Recovered' || isRunning) return
    setIsRunning(true)
    setNotice('Agent is checking policy, channel consent, and retry limits...')
    window.setTimeout(() => {
      setCases((cur) => cur.map((c) => (c.id === selected.id ? { ...c, status: 'Recovered' } : c)))
      setAudit((cur) => [
        { time: '09:44:03', text: `Recovery action sent to ${selected.name} via ${selected.channel}`, kind: 'success' },
        ...cur,
      ])
      setNotice(`${selected.id} is now in recovery. Stop rule armed after one attempt.`)
      setIsRunning(false)
    }, 650)
  }

  const columns = [
    {
      key: 'id', header: 'Case', width: 110,
      render: (r) => (
        <div className={styles.caseCol}>
          <span className={styles.caseDot}>{typeIcon(r.type)}</span>
          <span className={styles.caseId}>{r.id}</span>
        </div>
      ),
    },
    {
      key: 'company', header: 'Customer / company',
      render: (r) => (
        <div className={styles.caseMain}>
          <span className={styles.caseCompany}>{r.company}</span>
          <span className={styles.caseReason}>{r.type} · {r.reason}</span>
        </div>
      ),
    },
    { key: 'amount', header: 'At risk', align: 'right', sortable: true, render: (r) => fmt(r.amount) },
    { key: 'age', header: 'Detected', render: (r) => r.age },
    {
      key: 'risk', header: 'Risk', width: 90,
      render: (r) => <Pill variant={riskVariant(r.status === 'Recovered' ? 'Low' : r.risk)}>{r.status === 'Recovered' ? 'Recovered' : r.risk}</Pill>,
    },
    { key: 'next', header: 'Next action', render: (r) => r.next },
  ]

  return (
    <div className={styles.page}>
      <TitleBar
        title="Win back slipping revenue."
        subtitle="One agent from signal to compliant recovery — every decision visible."
        action={
          <button className={styles.secondaryBtn}><FileCheck2 size={15} /> Export audit</button>
        }
      />

      <Section
        title="Revenue Recovery Agent"
        subtitle="Detects degradation, diagnoses the cause, chooses the least intrusive action, and stops when the customer responds."
        icon={<Sparkles size={16} />}
        right={
          <div className={styles.heroMeta}>
            <div className={styles.metaItem}><strong>86%</strong><span>policy confidence</span></div>
            <div className={styles.metaItem}><strong>1 / 3</strong><span>retry budget used</span></div>
            <div className={styles.metaItem}><ShieldCheck size={13} /> Guardrails active</div>
          </div>
        }
      />

      <StatGrid>
        <StatCard label="At risk today" value={fmt(totalAtRisk)} icon={<AlertCircle size={16} />}
          subtitle={`${cases.length} cases need a decision`} />
        <StatCard label="Recovered this week" value={fmt(124800 + recovered)} positive icon={<ArrowRight size={16} />}
          subtitle="18.6% conversion from action" />
        <StatCard label="Median time to action" value="4m 12s" icon={<Clock3 size={16} />}
          subtitle="32% faster than last week" />
        <StatCard label="Customer-safe actions" value="98.4%" icon={<ShieldCheck size={16} />}
          subtitle="No escalations today" />
      </StatGrid>

      <div className={styles.workspace}>
        <section className={styles.queuePanel}>
          <div className={styles.panelHeader}>
            <div><span className={styles.kicker}>Live queue</span><h2>Revenue at risk</h2></div>
            <span className={styles.queueCount}>{visibleCases.length} open</span>
          </div>
          <div className={styles.filterBar}>
            {FILTERS.map((item) => (
              <button
                key={item}
                className={`${styles.filterChip} ${filter === item ? styles.filterActive : ''}`}
                onClick={() => setFilter(item)}
              >{item}</button>
            ))}
          </div>
          <DataTable
            columns={columns}
            rows={visibleCases}
            rowKey="id"
            onRowClick={(r) => setSelectedId(r.id)}
            emptyTitle="No cases match this filter"
            emptyDesc="Try selecting a different risk or type."
          />
        </section>

        <aside className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div><span className={styles.kicker}>Recommended intervention</span><h2>{selected?.id}</h2></div>
            <Pill variant={riskVariant(selected?.status === 'Recovered' ? 'Low' : selected?.risk)}>{selected?.status || selected?.risk}</Pill>
          </div>

          <div className={styles.amountBlock}>
            <span>Recoverable amount</span>
            <strong>{fmt(selected?.amount || 0)}</strong>
            <small>Likelihood of recovery <b>78%</b></small>
            <div className={styles.progress}><span style={{ width: '78%' }} /></div>
          </div>

          <div className={styles.reasonBlock}>
            <span className={styles.kicker}>Why this action</span>
            <p><Bot size={15} /> {selected?.reason} detected. Customer has a successful payment history and opted into {selected?.channel} updates.</p>
          </div>

          <div className={styles.actionCard}>
            <div className={styles.actionIcon}>
              {selected?.channel === 'Email' ? <Mail size={17} /> : selected?.channel === 'Voice' ? <MessageSquareText size={17} /> : <CreditCard size={17} />}
            </div>
            <div>
              <span className={styles.actionLabel}>Next best action</span>
              <strong>{selected?.next}</strong>
              <small>Send once · wait 48h · stop on response</small>
            </div>
            <Check className={styles.actionCheck} size={17} />
          </div>

          <div className={styles.stopRules}>
            <div className={styles.rulesTitle}><PauseCircle size={14} /> Stop rules</div>
            <span><Check size={13} /> Stop after one attempt</span>
            <span><Check size={13} /> Suppress after reply or payment</span>
            <span><Check size={13} /> Escalate only above 30 days overdue</span>
          </div>

          {notice && <div className={styles.notice}>{notice}</div>}
          <button
            className={styles.runButton}
            onClick={runRecovery}
            disabled={isRunning || selected?.status === 'Recovered'}
          >
            {selected?.status === 'Recovered'
              ? <><Check size={15} /> Recovery recorded</>
              : <><Play size={15} /> Approve & run action</>}
          </button>
          <div className={styles.consent}><ShieldCheck size={13} /> Consent verified · quiet hours protected</div>
        </aside>
      </div>

      <Section
        title="Audit trail"
        subtitle="Decision log"
        icon={<span className={styles.liveDot} />}
      />
      <div className={styles.auditPanel}>
        <div className={styles.auditList}>
          {audit.map((item, index) => (
            <div className={styles.auditRow} key={`${item.time}-${index}`}>
              <span className={styles.auditTime}>{item.time}</span>
              <span className={`${styles.auditDot} ${styles[`audit${item.kind}`]}`} />
              <span>{item.text}</span>
              <span className={styles.auditTag}>{item.kind === 'success' ? 'ACTION' : item.kind.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
