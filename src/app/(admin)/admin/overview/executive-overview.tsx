'use client'

import RevenueTrendChart from './revenue-trend-chart'
import PipelineFunnelChart from './pipeline-funnel-chart'
import FulfillmentDistributionChart from './fulfillment-distribution-chart'
import CompactActionFeed from './compact-action-feed'

interface ExecutiveOverviewProps {
	orders: any[]
	leads: any[]
	timeframe: string
	customRange?: { startDate: Date | null; endDate: Date | null; preset?: string } | null
	urgentB2BLeads: any[]
	actionableOrdersList: any[]
	setActiveTab: (tab: any) => void
	setSelectedLeadForDetail: (lead: any) => void
	setSelectedOrderForDetail: (order: any) => void
	setSelectedOrderForPrint: (order: any) => void
}

export default function ExecutiveOverview({
	orders = [],
	leads = [],
	timeframe = '30d',
	customRange,
	urgentB2BLeads = [],
	actionableOrdersList = [],
	setActiveTab,
	setSelectedLeadForDetail,
	setSelectedOrderForDetail,
	setSelectedOrderForPrint,
}: ExecutiveOverviewProps) {
	return (
		<div className="space-y-6">
			{/* ROW 1: Visual Analytics (Revenue Trend + B2B Pipeline Funnel) */}
			<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
				{/* Col 1: 7-col or 8-col: Revenue & Volume Curve */}
				<div className="xl:col-span-7 2xl:col-span-8 flex flex-col">
					<RevenueTrendChart orders={orders} timeframe={timeframe} customRange={customRange} />
				</div>

				{/* Col 2: 5-col or 4-col: B2B Conversion Funnel */}
				<div className="xl:col-span-5 2xl:col-span-4 flex flex-col">
					<PipelineFunnelChart leads={leads} onOpenLeads={() => setActiveTab('leads')} />
				</div>
			</div>

			{/* ROW 2: Fulfillment Distribution & Compact Action Center */}
			<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
				{/* Col 1: Fulfillment Status Distribution Donut */}
				<div className="xl:col-span-5 flex flex-col">
					<FulfillmentDistributionChart orders={orders} onOpenOrders={() => setActiveTab('orders')} />
				</div>

				{/* Col 2: Compact Action Feed (Replaces the 2 bulky text columns) */}
				<div className="xl:col-span-7 flex flex-col">
					<CompactActionFeed
						urgentB2BLeads={urgentB2BLeads}
						actionableOrders={actionableOrdersList}
						onSelectLead={setSelectedLeadForDetail}
						onSelectOrder={setSelectedOrderForDetail}
						onPrintOrder={setSelectedOrderForPrint}
						onViewAllLeads={() => setActiveTab('leads')}
						onViewAllOrders={() => setActiveTab('orders')}
					/>
				</div>
			</div>
		</div>
	)
}
