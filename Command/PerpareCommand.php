<?php

namespace Hexmedia\KnockoutBootstrapBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Hexmedia\BootstrapBundle\File\Symlink;
use Symfony\Component\Filesystem\Filesystem;

class PerpareCommand extends ContainerAwareCommand {

	protected function configure() {
		parent::configure();

		$this
			->setName('hexmedia:knockout-bootstrap:prepare')
			->setDescription("Prepares knockout-bootstrap bundle")
			->addArgument('bootstrap', InputArgument::OPTIONAL, 'Where is hexmedia/knockout-bootstrap located?')
			->addOption('force', null, InputOption::VALUE_NONE, 'Force override')
		;
	}

	protected function execute(InputInterface $input, OutputInterface $output) {
		$fs = new Filesystem();

		$kernel = $this->getApplication()->getKernel();
		$container = $this->getApplication()->getKernel()->getContainer();

		$path = $kernel->locateResource("@HexmediaKnockoutBootstrapBundle/Resources");
		$pathKnockoutBootstrap = $path . DIRECTORY_SEPARATOR . 'knockout-bootstrap';
		$pathPublic = $path . DIRECTORY_SEPARATOR . 'public';

		$fs->mirror('.' . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'hexmedia' . DIRECTORY_SEPARATOR . 'knockout-bootstrap', $pathKnockoutBootstrap);

		//		Symlink::createSymlink(, $symlinkName)
//		Symlink::createBootstrapSymlink($input->getOption('force'), $input->getArgument('bootstrap'));

		$output->writeln("... <info>OK</info> ...");
	}

}

