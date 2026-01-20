"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { ClimateData } from "@/lib/supabase/types"

interface ChartData {
  date: Date
  temperature: number | null
  humidity: number | null
  rainfall: number | null
}

export function ClimateTimelineChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<"temperature" | "humidity" | "rainfall" | "all">("all")

  useEffect(() => {
    async function fetchClimateData() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Get data from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: climateData, error } = await supabase
          .from("climate_data")
          .select("*")
          .eq("user_id", user.id)
          .gte("recorded_at", thirtyDaysAgo.toISOString())
          .order("recorded_at", { ascending: true })

        if (error) {
          console.error("Error fetching climate data:", error)
          setLoading(false)
          return
        }

        if (climateData) {
          const formattedData: ChartData[] = climateData.map((d) => ({
            date: new Date(d.recorded_at),
            temperature: d.temperature ? Number(d.temperature) : null,
            humidity: d.humidity ? Number(d.humidity) : null,
            rainfall: d.rainfall_mm ? Number(d.rainfall_mm) : null,
          }))

          setData(formattedData)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchClimateData()
  }, [])

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    // Clear previous chart and tooltip
    d3.select(svgRef.current).selectAll("*").remove()
    d3.select("body").selectAll(".tooltip").remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 30, right: 40, bottom: 50, left: 60 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 350 - margin.top - margin.bottom

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width])

    // Determine y scale based on selected metric
    let yScale: d3.ScaleLinear<number, number>
    let yLabel = ""

    if (selectedMetric === "temperature") {
      const tempValues = data.map((d) => d.temperature).filter((v) => v !== null) as number[]
      const minTemp = Math.min(...tempValues, 0)
      const maxTemp = Math.max(...tempValues, 40)
      yScale = d3.scaleLinear().domain([minTemp, maxTemp]).range([height, 0]).nice()
      yLabel = "Temperature (°C)"
    } else if (selectedMetric === "humidity") {
      yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]).nice()
      yLabel = "Humidity (%)"
    } else if (selectedMetric === "rainfall") {
      const rainValues = data.map((d) => d.rainfall).filter((v) => v !== null) as number[]
      const maxRain = Math.max(...rainValues, 0)
      yScale = d3.scaleLinear().domain([0, maxRain * 1.1]).range([height, 0]).nice()
      yLabel = "Rainfall (mm)"
    } else {
      // All metrics - use dual axis
      const tempValues = data.map((d) => d.temperature).filter((v) => v !== null) as number[]
      const minTemp = Math.min(...tempValues, 0)
      const maxTemp = Math.max(...tempValues, 40)
      yScale = d3.scaleLinear().domain([minTemp, maxTemp]).range([height, 0]).nice()
      yLabel = "Temperature (°C) / Humidity (%)"
    }

    // Line generators
    const lineGenerator = d3
      .line<ChartData>()
      .x((d) => xScale(d.date))
      .y((d, i) => {
        if (selectedMetric === "temperature") return yScale(d.temperature || 0)
        if (selectedMetric === "humidity") return yScale(d.humidity || 0)
        if (selectedMetric === "rainfall") return yScale(d.rainfall || 0)
        return yScale(d.temperature || 0) // Default for "all"
      })
      .curve(d3.curveMonotoneX)
      .defined((d) => {
        if (selectedMetric === "temperature") return d.temperature !== null
        if (selectedMetric === "humidity") return d.humidity !== null
        if (selectedMetric === "rainfall") return d.rainfall !== null
        return d.temperature !== null
      })

    // Draw grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-height)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3")

    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3")

    // Draw axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat(d3.timeFormat("%d %b") as (d: d3.NumberValue) => string)
      )
      .selectAll("text")
      .style("fill", "#6b7280")
      .style("font-size", "12px")
      .style("font-weight", "500")

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .style("fill", "#6b7280")
      .style("font-size", "12px")
      .style("font-weight", "500")
    
    // Add axis labels
    if (yLabel) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "#6b7280")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text(selectedMetric === "rainfall" ? "Neerslag (mm)" : yLabel)
    }

    // Draw lines
    if (selectedMetric === "all") {
      // Temperature line
      const tempLine = lineGenerator
        .y((d) => yScale(d.temperature || 0))
        .defined((d) => d.temperature !== null)

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 2.5)
        .attr("d", tempLine)
        .style("filter", "drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))")

      // Humidity line (scaled to temperature range for visibility)
      const humidityScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([yScale.domain()[0], yScale.domain()[1]])

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "5,5")
        .attr(
          "d",
          d3
            .line<ChartData>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(humidityScale(d.humidity || 0)))
            .curve(d3.curveMonotoneX)
            .defined((d) => d.humidity !== null)(data)
        )
        .style("filter", "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))")

      // Rainfall bars
      const rainfallScale = d3
        .scaleLinear()
        .domain([0, Math.max(...data.map((d) => d.rainfall || 0))])
        .range([0, height * 0.3])

      g.selectAll(".rainfall-bar")
        .data(data.filter((d) => d.rainfall !== null && d.rainfall > 0))
        .enter()
        .append("rect")
        .attr("class", "rainfall-bar")
        .attr("x", (d) => xScale(d.date) - 3)
        .attr("y", (d) => height - rainfallScale(d.rainfall || 0))
        .attr("width", 6)
        .attr("height", (d) => rainfallScale(d.rainfall || 0))
        .attr("fill", "#2563eb")
        .attr("opacity", 0.7)
        .attr("rx", 2)
        .style("filter", "drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))")
    } else if (selectedMetric === "rainfall") {
      // Rainfall bars - better visualization for rainfall data
      const barWidth = Math.max(4, (width / data.length) * 0.6)
      const rainfallData = data.filter((d) => d.rainfall !== null && d.rainfall > 0)
      
      // Create gradient for rainfall bars
      const gradient = g.append("defs")
        .append("linearGradient")
        .attr("id", "rainfallBarGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#60a5fa")
        .attr("stop-opacity", 0.9)
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#2563eb")
        .attr("stop-opacity", 1)

      g.selectAll(".rainfall-bar")
        .data(rainfallData)
        .enter()
        .append("rect")
        .attr("class", "rainfall-bar")
        .attr("x", (d) => xScale(d.date) - barWidth / 2)
        .attr("y", (d) => yScale(d.rainfall || 0))
        .attr("width", barWidth)
        .attr("height", (d) => height - yScale(d.rainfall || 0))
        .attr("fill", "url(#rainfallBarGradient)")
        .attr("rx", 3)
        .style("filter", "drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))")
        .style("transition", "opacity 0.2s")
        .on("mouseover", function() {
          d3.select(this).attr("opacity", 0.8)
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity", 1)
        })
    } else {
      // Single metric line (temperature or humidity)
      const color =
        selectedMetric === "temperature"
          ? "#f59e0b"
          : "#3b82f6"

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("d", lineGenerator)
        .style("filter", `drop-shadow(0 2px 4px ${color}33)`)

      // Add dots for data points
      g.selectAll(".dot")
        .data(data.filter((d) => {
          if (selectedMetric === "temperature") return d.temperature !== null
          return d.humidity !== null
        }))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => {
          if (selectedMetric === "temperature") return yScale(d.temperature || 0)
          return yScale(d.humidity || 0)
        })
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
    }

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "10px 14px")
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("z-index", 1000)
      .style("min-width", "120px")

    // Add invisible overlay for mouse tracking (only for line charts, not for rainfall bars)
    if (selectedMetric !== "rainfall") {
      g.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .on("mousemove", function (event) {
          const [mouseX] = d3.pointer(event)
          const x0 = xScale.invert(mouseX)
          const bisect = d3.bisector((d: ChartData) => d.date).left
          const i = bisect(data, x0, 1)
          const d0 = data[i - 1]
          const d1 = data[i]
          const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0

          const xPos = xScale(d.date)
          let yPos = 0
          if (selectedMetric === "temperature") {
            yPos = yScale(d.temperature || 0)
          } else if (selectedMetric === "humidity") {
            yPos = yScale(d.humidity || 0)
          } else {
            yPos = yScale(d.temperature || 0)
          }

          tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`)
            .html(
              `<strong>${d3.timeFormat("%d %b %Y")(d.date)}</strong><br/>` +
                (selectedMetric === "all" || selectedMetric === "temperature"
                  ? `Temperatuur: ${d.temperature?.toFixed(1) || "N/A"}°C<br/>`
                  : "") +
                (selectedMetric === "all" || selectedMetric === "humidity"
                  ? `Luchtvochtigheid: ${d.humidity?.toFixed(1) || "N/A"}%<br/>`
                  : "") +
                (selectedMetric === "all" || selectedMetric === "rainfall"
                  ? `Neerslag: ${d.rainfall?.toFixed(1) || "N/A"}mm`
                  : "")
            )

          // Draw vertical line
          g.selectAll(".hover-line").remove()
          g.append("line")
            .attr("class", "hover-line")
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#6b7280")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3")
            .attr("opacity", 0.5)
        })
        .on("mouseleave", () => {
          tooltip.style("opacity", 0)
          g.selectAll(".hover-line").remove()
        })
    } else {
      // For rainfall bars, add tooltip directly to bars
      g.selectAll(".rainfall-bar")
        .on("mousemove", function (event: MouseEvent) {
          const d = d3.select(this).datum() as ChartData
          tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`)
            .html(
              `<strong>${d3.timeFormat("%d %b %Y")(d.date)}</strong><br/>` +
              `Neerslag: ${d.rainfall?.toFixed(1) || "N/A"}mm`
            )
        })
        .on("mouseleave", () => {
          tooltip.style("opacity", 0)
        })
    }

    // Cleanup function
    return () => {
      d3.select("body").selectAll(".tooltip").remove()
    }
  }, [data, selectedMetric])

  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground" suppressHydrationWarning>
        Klimaatdata laden...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground" suppressHydrationWarning>
        Geen klimaatdata beschikbaar voor de afgelopen 30 dagen.
      </div>
    )
  }

  return (
    <div className="space-y-4" suppressHydrationWarning>
      {/* Filter Buttons */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button
          variant={selectedMetric === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMetric("all")}
          className={selectedMetric === "all" ? "bg-agri-green hover:bg-agri-green-dark text-white" : ""}
        >
          Alles
        </Button>
        <Button
          variant={selectedMetric === "temperature" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMetric("temperature")}
          className={selectedMetric === "temperature" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
        >
          Temperatuur
        </Button>
        <Button
          variant={selectedMetric === "humidity" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMetric("humidity")}
          className={selectedMetric === "humidity" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
        >
          Luchtvochtigheid
        </Button>
        <Button
          variant={selectedMetric === "rainfall" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedMetric("rainfall")}
          className={selectedMetric === "rainfall" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
        >
          Regenval
        </Button>
      </div>

      {/* Chart */}
      <div className="w-full bg-card rounded-lg border border-border p-4" suppressHydrationWarning>
        <svg ref={svgRef} width="100%" height="350" style={{ overflow: "visible" }} />
      </div>

      {/* Legend */}
      {selectedMetric === "all" && (
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-amber-500"></div>
            <span>Temperatuur (°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 border-dashed border-t-2"></div>
            <span>Luchtvochtigheid (%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-600 opacity-60 rounded-sm"></div>
            <span>Regenval (mm)</span>
          </div>
        </div>
      )}
    </div>
  )
}
