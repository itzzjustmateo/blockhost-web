package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

const (
	cyan    = "#00d4ff"
	magenta = "#ff77ff"
	gray    = "#888888"
	white   = "#ffffff"
	black   = "#1a1a2e"
)

var titleStyle = lipgloss.NewStyle().
	Bold(true).
	Foreground(lipgloss.Color(white)).
	Background(lipgloss.Color(black)).
	Padding(0, 2).
	Align(lipgloss.Center)

var dimStyle = lipgloss.NewStyle().Foreground(lipgloss.Color(gray))

type processItem struct {
	name   string
	prefix string
	color  string
	cmd    string
	args   []string

	running bool
	done    bool
	err     error
	output  []string

	viewport viewport.Model
}

type processOutputMsg struct {
	name string
	line string
}

type processDoneMsg struct {
	name string
	err  error
}

type model struct {
	processes []*processItem
	ready     bool
	width     int
	height    int
	program   *tea.Program
}

func newProcess(name, prefix, color, command string, args ...string) *processItem {
	return &processItem{
		name: name,
		prefix: prefix,
		color: color,
		cmd: command,
		args: args,
	}
}

func initialModel() model {
	return model{
		processes: []*processItem{
			newProcess("Dev Server", " DEV ", cyan, "bun", "run", "dev"),
			newProcess("DB Studio", " DB  ", magenta, "bun", "run", "db:studio"),
		},
	}
}

func (p *processItem) start(program *tea.Program) tea.Cmd {
	return func() tea.Msg {
		cmd := exec.Command(p.cmd, p.args...)
		cmd.Dir = "."

		stdout, err := cmd.StdoutPipe()
		if err != nil {
			return processDoneMsg{name: p.name, err: err}
		}
		stderr, err := cmd.StderrPipe()
		if err != nil {
			return processDoneMsg{name: p.name, err: err}
		}

		if err := cmd.Start(); err != nil {
			return processDoneMsg{name: p.name, err: err}
		}

		readStream := func(r io.Reader) {
			scanner := bufio.NewScanner(r)
			scanner.Buffer(make([]byte, 1024*64), 1024*64)
			for scanner.Scan() {
				if program != nil {
					program.Send(processOutputMsg{name: p.name, line: scanner.Text()})
				}
			}
		}

		go readStream(stdout)
		go readStream(stderr)

		err = cmd.Wait()
		return processDoneMsg{name: p.name, err: err}
	}
}

func (m model) Init() tea.Cmd {
	cmds := make([]tea.Cmd, len(m.processes))
	for i, proc := range m.processes {
		cp := proc
		cmds[i] = cp.start(m.program)
	}
	return tea.Batch(cmds...)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.ready = true
		for _, proc := range m.processes {
			proc.viewport.Width = max(60, m.width-6)
			proc.viewport.Height = max(5, (m.height-10)/2-4)
		}
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		}

	case processOutputMsg:
		for _, proc := range m.processes {
			if proc.name == msg.name {
				proc.running = true
				if len(proc.output) >= 500 {
					proc.output = proc.output[1:]
				}
				proc.output = append(proc.output, msg.line)
				proc.viewport.SetContent(strings.Join(proc.output, "\n"))
				proc.viewport.GotoBottom()
				break
			}
		}
		return m, nil

	case processDoneMsg:
		for _, proc := range m.processes {
			if proc.name == msg.name {
				proc.done = true
				proc.running = false
				proc.err = msg.err
				break
			}
		}
		return m, nil
	}

	return m, nil
}

func (m model) View() string {
	if !m.ready {
		return "\n  Loading..."
	}

	title := titleStyle.Render(" BlockHost Development Dashboard ")
	help := dimStyle.Render("  Press q or Ctrl+C to quit")

	panels := make([]string, 0, len(m.processes))
	for _, proc := range m.processes {
		panels = append(panels, renderProcess(proc, m.width))
	}

	content := lipgloss.JoinVertical(lipgloss.Center, panels...)

	return lipgloss.JoinVertical(
		lipgloss.Center,
		"",
		title,
		"",
		content,
		"",
		help,
	)
}

func renderProcess(p *processItem, width int) string {
	var statusText string
	var statusStyle lipgloss.Style

	statusColor := lipgloss.Color(p.color)

	if p.done {
		if p.err != nil {
			statusText = " ✗ FAILED  "
			statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#ff0000")).Bold(true)
		} else {
			statusText = " ■ STOPPED "
			statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color(gray)).Bold(true)
		}
	} else if p.running {
		statusText = " ● RUNNING "
		statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#00ff00")).Bold(true)
	} else {
		statusText = " ◇ PENDING "
		statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color(gray))
	}

	header := lipgloss.NewStyle().
		Background(statusColor).
		Foreground(lipgloss.Color(black)).
		Bold(true).
		Padding(0, 2).
		Render(fmt.Sprintf(" %s ", p.name))

	status := statusStyle.Render(statusText)
	titleLine := lipgloss.JoinHorizontal(lipgloss.Top, header, "  ", status)

	cmdLine := dimStyle.Render(fmt.Sprintf("  %s %s", p.cmd, strings.Join(p.args, " ")))

	var output string
	if len(p.output) > 0 {
		output = p.viewport.View()
	} else if !p.running && !p.done {
		output = dimStyle.Render("  Waiting to start...")
	} else {
		output = dimStyle.Render("  No output yet...")
	}

	panelWidth := max(60, width-6)
	border := lipgloss.NewStyle().
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color(p.color)).
		Padding(0, 1).
		Width(panelWidth)

	return border.Render(
		lipgloss.JoinVertical(
			lipgloss.Left,
			titleLine,
			cmdLine,
			"",
			output,
		),
	)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func main() {
	m := initialModel()
	p := tea.NewProgram(m, tea.WithAltScreen())
	m.program = p

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
