"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

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

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .style("fill", "#6b7280")
      .style("font-size", "12px")

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
        .attr("stroke-width", 2)
        .attr("d", tempLine)

      // Humidity line (scaled to temperature range for visibility)
      const humidityScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([yScale.domain()[0], yScale.domain()[1]])

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
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
        .attr("x", (d) => xScale(d.date) - 2)
        .attr("y", (d) => height - rainfallScale(d.rainfall || 0))
        .attr("width", 4)
        .attr("height", (d) => rainfallScale(d.rainfall || 0))
        .attr("fill", "#3b82f6")
        .attr("opacity", 0.6)
    } else {
      // Single metric line
      const color =
        selectedMetric === "temperature"
          ? "#f59e0b"
          : selectedMetric === "humidity"
            ? "#3b82f6"
            : "#2563eb"

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .attr("d", lineGenerator)

      // Add dots for data points
      g.selectAll(".dot")
        .data(data.filter((d) => {
          if (selectedMetric === "temperature") return d.temperature !== null
          if (selectedMetric === "humidity") return d.humidity !== null
          return d.rainfall !== null
        }))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => {
          if (selectedMetric === "temperature") return yScale(d.temperature || 0)
          if (selectedMetric === "humidity") return yScale(d.humidity || 0)
          return yScale(d.rainfall || 0)
        })
        .attr("r", 3)
        .attr("fill", color)
    }

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px 12px")
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px")
      .style("z-index", 1000)

    // Add invisible overlay for mouse tracking
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
        const yPos =
          selectedMetric === "temperature"
            ? yScale(d.temperature || 0)
            : selectedMetric === "humidity"
              ? yScale(d.humidity || 0)
              : selectedMetric === "rainfall"
                ? yScale(d.rainfall || 0)
                : yScale(d.temperature || 0)

        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
          .html(
            `<strong>${d3.timeFormat("%d %b %Y")(d.date)}</strong><br/>` +
              (selectedMetric === "all" || selectedMetric === "temperature"
                ? `Temp: ${d.temperature?.toFixed(1) || "N/A"}°C<br/>`
                : "") +
              (selectedMetric === "all" || selectedMetric === "humidity"
                ? `Humidity: ${d.humidity?.toFixed(1) || "N/A"}%<br/>`
                : "") +
              (selectedMetric === "all" || selectedMetric === "rainfall"
                ? `Rainfall: ${d.rainfall?.toFixed(1) || "N/A"}mm`
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
  }, [data, selectedMetric])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Klimaatdata - Laatste 30 Dagen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Klimaatdata - Laatste 30 Dagen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Geen klimaatdata beschikbaar voor de afgelopen 30 dagen. Voeg klimaatrecords toe om de grafiek te zien.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Klimaatdata - Laatste 30 Dagen</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric("all")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedMetric === "all"
                  ? "bg-agri-green text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Alles
            </button>
            <button
              onClick={() => setSelectedMetric("temperature")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedMetric === "temperature"
                  ? "bg-agri-yellow text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Temperatuur
            </button>
            <button
              onClick={() => setSelectedMetric("humidity")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedMetric === "humidity"
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Luchtvochtigheid
            </button>
            <button
              onClick={() => setSelectedMetric("rainfall")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedMetric === "rainfall"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Regenval
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <svg ref={svgRef} width="100%" height="300" style={{ overflow: "visible" }} />
        </div>
        {selectedMetric === "all" && (
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-agri-yellow"></div>
              <span>Temperatuur</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500 border-dashed border-t-2"></div>
              <span>Luchtvochtigheid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 bg-blue-600 opacity-60"></div>
              <span>Regenval</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
