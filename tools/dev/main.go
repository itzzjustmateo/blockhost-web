package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
)

const (
	cyan   = "\033[36m"
	magenta = "\033[35m"
	reset  = "\033[0m"
	bold   = "\033[1m"
	dim    = "\033[2m"
	clear  = "\033[H\033[2J"
)

func main() {
	fmt.Print(clear)

	fmt.Printf("%s╔══════════════════════════════════════╗%s\n", bold, reset)
	fmt.Printf("%s║   BlockHost Development Dashboard   ║%s\n", bold, reset)
	fmt.Printf("%s╚══════════════════════════════════════╝%s\n\n", bold, reset)

	var wg sync.WaitGroup

	cmds := []struct {
		name    string
		command string
		args    []string
		color   string
		prefix  string
	}{
		{
			name:    "Dev Server",
			command: "bun",
			args:    []string{"run", "dev"},
			color:   cyan,
			prefix:  " DEV ",
		},
		{
			name:    "DB Studio",
			command: "bun",
			args:    []string{"run", "db:studio"},
			color:   magenta,
			prefix:  " DB  ",
		},
	}

	for _, c := range cmds {
		wg.Add(1)
		go func(cmd struct {
			name    string
			command string
			args    []string
			color   string
			prefix  string
		}) {
			defer wg.Done()
			runCmd(cmd)
		}(c)
	}

	wg.Wait()
}

func runCmd(cmd struct {
	name    string
	command string
	args    []string
	color   string
	prefix  string
}) {
	c := exec.Command(cmd.command, cmd.args...)
	c.Dir = "."

	stdout, err := c.StdoutPipe()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s%s %sFAILED%s: %v\n", bold, cmd.color, reset, err)
		return
	}

	stderr, err := c.StderrPipe()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s%s %sFAILED%s: %v\n", bold, cmd.color, reset, err)
		return
	}

	if err := c.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "%s%s %sFAILED%s: %v\n", bold, cmd.color, reset, err)
		return
	}

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		printLines(stdout, cmd.color, cmd.prefix)
	}()
	go func() {
		defer wg.Done()
		printLines(stderr, cmd.color, cmd.prefix)
	}()

	wg.Wait()
	c.Wait()

	fmt.Printf("%s%s ═══ Exited ═══%s\n", cmd.color, cmd.prefix, reset)
}

func printLines(r io.Reader, color, prefix string) {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 1024*64), 1024*64)
	for scanner.Scan() {
		line := scanner.Text()
		fmt.Printf("%s%s%s %s%s\n", dim, color, prefix, reset, line)
	}
}
